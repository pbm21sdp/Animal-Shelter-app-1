FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY .. .

# Use environment variables from .env.docker
CMD ["sh", "-c", "node src/app.js"]