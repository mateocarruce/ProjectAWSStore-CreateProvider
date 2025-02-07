const axios = require('axios');
const Provider = require('./models/provider'); // Modelo para la base de datos remota

const resolvers = {
    Mutation: {
        createProvider: async (_, { input }) => {
            try {
                // Inserta el proveedor en la base de datos remota
                const provider = await Provider.create(input);

                // Notificar a los otros microservicios
              //  const instances = [
             //       'http://localhost:5001/sync-create', // Microservicio de Eliminar
            //        'http://localhost:5002/sync-create',  // Microservicio de Update
           //         'http://localhost:5003/sync-create'  // ✅ Microservicio de Leer
         //       ];

                const instances = [
                    'http://provider-delete-container:5001/sync-create', // Microservicio de Eliminar
                    'http://provider-update-container:5002/sync-create',  // Microservicio de Update
                    'http://provider-read-container:5003/sync-create'  // Microservicio de Leer
                ];


                for (const instance of instances) {
                    try {
                        await axios.post(instance, provider.toJSON());
                        console.log(`Notificación enviada a ${instance}`);
                    } catch (error) {
                        console.error(`Error notificando a ${instance}:`, error.message);
                    }
                }

                return provider;
            } catch (error) {
                console.error('Error creando proveedor:', error);
                throw new Error('Failed to create provider');
            }
        },
    },
};

module.exports = resolvers;
