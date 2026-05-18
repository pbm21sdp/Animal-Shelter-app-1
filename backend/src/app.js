import express from 'express';
import swaggerUi from 'swagger-ui-express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerSpec from './docs/swagger.js';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from './config/passport.js';
import path from 'path';
import { generalLimiter } from './middleware/rateLimiter.js';

import { connectPostgresDB, pool } from './config/database/connectPostgresDB.js';
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
import animalsRoutes from './routes/animals.routes.js';
import aiRoutes from './routes/ai.routes.js';
import conversationsRouter from './routes/conversations.routes.js';

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

// 1. Security headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// 2. CORS
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
}));

// 3. Special middleware for Stripe webhooks (BEFORE express.json())
app.use('/api/donations/webhook',
    express.raw({ type: 'application/json' }),
    donationRoutes
);

// 4. Body parsers (BEFORE routes)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 5. Cookie parser
app.use(cookieParser());

// 6. Session (needed only for the Google OAuth dance — JWT is used after that)
app.use(session({
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 10 * 60 * 1000, // 10 minutes — just for the OAuth flow
    },
}));

// 7. Passport
app.use(passport.initialize());
app.use(passport.session());

// 8. Static files
console.log('Serving uploads from:', path.join(__dirname, '..', 'uploads'));
app.use('/uploads', (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
}, express.static(path.join(__dirname, '..', 'uploads')));

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

// Apply rate limiting to all API routes
app.use('/api', generalLimiter);

app.use('/api/adoptions', adoptionRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/meetings', scheduledMeetingRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/animals', animalsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/conversations', conversationsRouter);
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

async function runConversationsMigration() {
    try {
        const fs = await import('fs');
        const path = await import('path');
        const { fileURLToPath } = await import('url');
        const __dirname = path.default.dirname(fileURLToPath(import.meta.url));
        const sqlPath = path.default.join(__dirname, '..', '..', 'db', 'migrations', 'create_conversations.sql');
        if (fs.default.existsSync(sqlPath)) {
            const sql = fs.default.readFileSync(sqlPath, 'utf8');
            await pool.query(sql);
            console.log('Conversations migration applied');
        }
    } catch (err) {
        console.error('Conversations migration error:', err.message);
    }
}

async function start() {
    await connectPostgresDB();
    await connectMongoDB();
    await runConversationsMigration();
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

start();
