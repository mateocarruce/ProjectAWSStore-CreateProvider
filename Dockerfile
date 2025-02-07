# Usa una imagen oficial de Node.js 22 como base
FROM node:22

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos de configuración
COPY package.json package-lock.json ./

# Instala las dependencias sin generar logs innecesarios
RUN npm install --omit=dev

# Copia el resto del código fuente
COPY . .

# Expone el puerto en el que corre Apollo Server
EXPOSE 5000 4000

# Comando para ejecutar el servidor
CMD ["node", "src/server.js"]
