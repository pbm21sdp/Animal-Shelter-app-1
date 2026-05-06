// routes/animals.routes.js
import express from 'express';
import { getStats } from '../controllers/about.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// GET /api/animals/stats — live platform statistics
router.get('/stats', verifyToken, getStats);

export default router;
