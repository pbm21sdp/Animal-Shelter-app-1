import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    apis: [
        path.join(__dirname, '../routes/*.js'),
        path.join(__dirname, '../routes/**/*.js')
    ],
};

const specs = swaggerJsdoc(options);
export default specs;