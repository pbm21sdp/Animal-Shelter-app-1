// src/swagger.js
import router from "./routes/users.js";

import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Animal Shelter API',
            version: '1.0.0',
            description: 'API for managing animal adoptions',
        },
        servers: [
            { url: 'http://localhost:3000' },
        ],
    },
    apis: ['./src/routes/*.js'], // Path to your route files
};

const specs = swaggerJsdoc(options);
export default specs;