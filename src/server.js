const { ApolloServer } = require('apollo-server-express');
const gql = require('graphql-tag');
const sequelize = require('./database'); // Importa la conexión de Sequelize
const resolvers = require('./resolvers'); // Resolvers para GraphQL
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const https = require('https');
const Provider = require('./models/provider');

const app = express();
app.use(bodyParser.json());

// ✅ Endpoint para sincronizar eliminación de proveedores desde el microservicio de Eliminar
app.post('/sync-delete', async (req, res) => {
    console.log('Solicitud recibida en /sync-delete:', req.body);
    const { id } = req.body;

    try {
        const provider = await Provider.findByPk(id);
        if (provider) {
            await provider.destroy();
            console.log(`Proveedor con ID ${id} eliminado en la base de Crear`);
        } else {
            console.log(`Proveedor con ID ${id} no encontrado en la base de Crear`);
        }

        res.status(200).send({ message: `Proveedor con ID ${id} eliminado correctamente en Crear` });
    } catch (error) {
        console.error('Error sincronizando eliminación de proveedor en Crear:', error);
        res.status(500).send({ error: 'Failed to sync provider delete' });
    }
});

// ✅ Endpoint para recibir actualizaciones desde el microservicio de Update
app.post('/sync-update', async (req, res) => {
    console.log('Solicitud recibida en /sync-update:', req.body);
    const { id, name, address, email } = req.body;

    try {
        const provider = await Provider.findByPk(id);
        if (provider) {
            await provider.update({ name, address, email });
            console.log(`Proveedor con ID ${id} actualizado en la base de Crear`);
        } else {
            console.log(`Proveedor con ID ${id} no encontrado en la base de Crear`);
        }

        res.status(200).send({ message: `Proveedor con ID ${id} actualizado correctamente en Crear` });
    } catch (error) {
        console.error('Error sincronizando actualización de proveedor en Crear:', error);
        res.status(500).send({ error: 'Failed to sync provider update' });
    }
});

// ✅ Endpoint para sincronizar la creación de proveedores en otros microservicios
app.post('/sync-create', async (req, res) => {
    console.log('Solicitud recibida en /sync-create:', req.body);
    const { id, name, address, email } = req.body;

    try {
        // Verifica si el proveedor ya existe en la base de datos de Crear
        const existingProvider = await Provider.findByPk(id);
        if (!existingProvider) {
            await Provider.create({ id, name, address, email });
            console.log(`Proveedor con ID ${id} sincronizado en la base de Crear`);
        } else {
            console.log(`Proveedor con ID ${id} ya existe en la base de Crear`);
        }

        res.status(200).send({ message: `Proveedor con ID ${id} sincronizado correctamente en Crear` });
    } catch (error) {
        console.error('Error sincronizando proveedor en Crear:', error);
        res.status(500).send({ error: 'Failed to sync provider creation' });
    }
});

// ✅ Iniciar el servidor REST en el puerto 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`REST server listening on port ${PORT}`);
});

// ✅ Esquema GraphQL
const typeDefs = gql`
    type Query {
        _empty: String
    }

    type Mutation {
        createProvider(input: ProviderInput!): Provider
    }

    input ProviderInput {
        name: String!
        address: String!
        email: String!
    }

    type Provider {
        id: ID!
        name: String!
        address: String!
        email: String!
    }
`;

// ✅ Crear instancia de Apollo Server
const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,  // Para permitir pruebas en GraphQL Playground
    playground: true,      // Habilita GraphQL Playground en producción
});

// ✅ Cargar certificados SSL
const privateKey = fs.readFileSync('/home/ec2-user/key.pem', 'utf8');
const certificate = fs.readFileSync('/home/ec2-user/cert.pem', 'utf8');
const credentials = { key: privateKey, cert: certificate };

// ✅ Sincronizar base de datos y levantar servidores
sequelize.sync()
    .then(() => {
        console.log('Database synced!');
        server.start().then(() => {
            server.applyMiddleware({ app });

            // Iniciar servidor HTTPS en el puerto 4000
            https.createServer(credentials, app).listen(4000, () => {
                console.log('🚀 Apollo Server uwu running on https://3.214.196.129:4000/graphql');
            });
        });
    })
    .catch(err => {
        console.error('Error syncing database:', err);
    });
