import swaggerJSDoc from 'swagger-jsdoc';
import path from 'path';
import { fileURLToPath } from 'url';

// Import all documentation modules
import { schemas } from './components/schemas.js';
import { responses } from './components/responses.js';
import { authDocs } from './routes/auth.docs.js';
import { adoptionsDocs } from './routes/adoptions.docs.js';
// import { petsDocs } from './routes/pets.docs.js';
// import { usersDocs } from './routes/users.docs.js';
// import { messagesDocs } from './routes/messages.docs.js';
// import { donationsDocs } from './routes/donations.docs.js';
// import { meetingsDocs } from './routes/meetings.docs.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'Paws Animal Shelter API',
        version: '1.0.0',
        description: 'Comprehensive API documentation for the Paws animal shelter application',
        contact: {
            name: 'API Support',
            email: 'support@animalshelter.com'
        },
        license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT'
        }
    },
    servers: [
        {
            url: 'http://localhost:5000',
            description: 'Local development server'
        },
        {
            url: 'https://api.paws.example.com',
            description: 'Production server'
        }
    ],
    components: {
        ...schemas,
        ...responses,
        securitySchemes: {
            cookieAuth: {
                type: 'apiKey',
                in: 'cookie',
                name: 'token',
                description: 'JWT authentication token stored in HTTP-only cookie'
            }
        }
    },
    security: [
        {
            cookieAuth: []
        }
    ],
    paths: {
        ...authDocs,
        ...adoptionsDocs,
        // ...petsDocs,
        // ...usersDocs,
        // ...messagesDocs,
        // ...donationsDocs,
        // ...meetingsDocs
    },
    tags: [
        { name: 'Authentication', description: 'User authentication and authorization endpoints' },
        { name: 'Adoptions', description: 'Adoption application management' },
        { name: 'Pets', description: 'Pet management and searching' },
        { name: 'Users', description: 'User profile and management' },
        { name: 'Messages', description: 'Contact and messaging system' },
        { name: 'Donations', description: 'Donation and payment processing' },
        { name: 'Meeting', description: 'Scheduled meetings for adoptions' }
    ]
};

const options = {
    definition: swaggerDefinition,
    apis: [] // Since we're using the programmatic approach, we don't need to scan files
};

export const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;