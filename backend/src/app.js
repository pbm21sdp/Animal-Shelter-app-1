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
import predictionRoutes from './routes/predictions.routes.js';

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

// ============================================
// MIDDLEWARE
// ============================================

// 1. CORS - Must come first
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

// 2. Special middleware for Stripe webhooks (BEFORE express.json())
app.use('/api/donations/webhook',
    express.raw({ type: 'application/json' }),
    donationRoutes
);

// 3. Body parsers with increased limit (BEFORE routes)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 4. Cookie parser
app.use(cookieParser());

// 5. Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// SWAGGER DOCUMENTATION
// ============================================

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    swaggerOptions: {
        filter: true,
        showRequestHeaders: true
    }
}));

// ============================================
// API ROUTES
// ============================================

app.use('/api/adoptions', adoptionRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/meetings', scheduledMeetingRoutes);
app.use('/api/predictions', predictionRoutes);
app.use("/api/auth", authRoutes);

// Root route
app.get("/", (req, res) => {
    res.send("Hello app!");
});

// ============================================
// ERROR HANDLER (MUST BE LAST)
// ============================================
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Server error!');
});

// Remove for prod...
console.log('Environment:', {
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
