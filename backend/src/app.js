import express from 'express';
import swaggerUi from 'swagger-ui-express';
import cors from 'cors';
import specs from './config/swagger.js';
import cookieParser from 'cookie-parser';

import { connectPostgresDB } from './config/database/connectPostgresDB.js';
import { config } from 'dotenv';
import { connectMongoDB } from "./config/database/connectMongoDB.js";

import { authRoutes } from "./routes/auth/auth.routes.js"

// Import routes
import adoptionRoutes from './routes/adoptions.js';
import petRoutes from './routes/pets.js';
import donationRoutes from './routes/donations.routes.js';
import userRoutes from './routes/user.routes.js';
import messageRoutes from './routes/message.routes.js';

// Load .env only in non-Docker environment
if (!process.env.DOCKER_ENV) {
    config({ path: './.env' });
} else {
    console.log('Running in Docker environment');
}


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({origin: "http://localhost:5173", credentials: true}));

// Special middleware for Stripe webhooks (must come before express.json())
app.post('/api/donations/webhook',
    express.raw({ type: 'application/json' }),
    donationRoutes
);

// Regular middleware for all other routes
app.use(express.json()); // allow us to parse incoming requests:req.body
app.use(cookieParser()); // allow us to parse incoming cookies

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// API ROUTES
app.use('/api/adoptions', adoptionRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

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