import express from 'express';
import swaggerUi from 'swagger-ui-express';
import cors from 'cors';
import swaggerSpec from './docs/swagger.js';
import cookieParser from 'cookie-parser';
import path from 'path';

import { connectPostgresDB } from './config/database/connectPostgresDB.js';
import { config } from 'dotenv';
import { connectMongoDB } from "./config/database/connectMongoDB.js";
import { fileURLToPath } from 'url';
import { authRoutes } from "./routes/auth/auth.routes.js"

// Import routes
import adoptionRoutes from './routes/adoptions.routes.js';
import petRoutes from './routes/pets.js';
import donationRoutes from './routes/donations.routes.js';
import userRoutes from './routes/user.routes.js';
import messageRoutes from './routes/message.routes.js';
import scheduledMeetingRoutes from './routes/scheduledMeeting.routes.js';

// Load .env only in non-Docker environment
if (!process.env.DOCKER_ENV) {
    config({ path: './.env' });
} else {
    console.log('Running in Docker environment');
}


const app = express();
const PORT = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors({origin: "http://localhost:5173", credentials: true}));

// DEBUG
// app.use(cors({
//     origin: "http://localhost:5173", // Your frontend URL
//     credentials: true, // Critical for cookies to work with cross-origin requests
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization']
// }));

// Special middleware for Stripe webhooks (must come before express.json())
app.post('/api/donations/webhook',
    express.raw({ type: 'application/json' }),
    donationRoutes
);

// Regular middleware for all other routes
app.use(express.json()); // allow us to parse incoming requests:req.body
app.use(cookieParser()); // allow us to parse incoming cookies

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    swaggerOptions: {
        filter: true,
        showRequestHeaders: true
    }
}));

app.post('/api/donations/webhook', 
    express.raw({ type: 'application/json' }), 
    donationRoutes
);

// API ROUTES
app.use('/api/adoptions', adoptionRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/meetings', scheduledMeetingRoutes);

// Root route
app.get("/", (req, res) => {
    res.send("Hello app!");
});

app.use("/api/auth", authRoutes);

// Error handler (MUST come after all routes)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Server error!');
});

/// Remove for prod...
console.log('Environment:', { // Only for local dev, remove for prod
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_USER: process.env.DB_USER,
    DB_NAME: process.env.DB_NAME
});


app.listen(PORT, () => {
    connectPostgresDB();
    connectMongoDB();
    console.log(`Server running on port ${PORT}`);
});

// app.use((req, res, next) => {
//     console.log(`Request to ${req.method} ${req.path}`);
//     console.log('Cookies:', req.cookies);
//     next();
// });
