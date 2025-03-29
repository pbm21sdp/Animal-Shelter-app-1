import express from 'express';
import swaggerUi from 'swagger-ui-express';
import cors from 'cors';
import specs from './config/swagger.js';
import cookieParser from 'cookie-parser';

import { pool } from './config/db.js';
import { config } from 'dotenv';
import { connectDB } from "./mongodb/connectDB.js";

import { authRoutes } from "./routes/auth/auth.routes.js"

// Import routes
import animalRoutes from './routes/animals.js';
import userRoutes from './routes/users.js';
import adoptionRoutes from './routes/adoptions.js';

// Load .env only in non-Docker environment
if (!process.env.DOCKER_ENV) {
    config({ path: './.env' });
} else {
    console.log('Running in Docker environment');
}

const app = express();
const PORT = process.env.PORT || 5000;

// Database connection check
pool.query('SELECT NOW()', (err) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('Database connected successfully');
    }
});

// Middleware
app.use(cors());
app.use(express.json()); // allow us to parse incoming requests:req.body
app.use(cookieParser()); // allow us to parse incoming cookies

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Routes (keep these before error handler)
app.use('/api/animals', animalRoutes);
app.use('/api/users', userRoutes);
app.use('/api/adoptions', adoptionRoutes);

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

console.log('Environment:', { // Only for local dev, remove for prod
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_USER: process.env.DB_USER,
    DB_NAME: process.env.DB_NAME
});


app.listen(PORT, () => {
    connectDB();
    console.log(`Server running on port ${PORT}`);
});
