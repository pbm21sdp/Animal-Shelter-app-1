// routes/animals.routes.js
import express from 'express';
import { getStats, getPlatformAnalytics } from '../controllers/about.controller.js';

const router = express.Router();

// GET /api/animals/stats — live platform statistics
router.get('/stats', getStats);

// GET /api/analytics/platform — analytics for the About page card
router.get('/analytics', getPlatformAnalytics);

export default router;
