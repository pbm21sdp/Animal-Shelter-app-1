// routes/animals.routes.js
import express from 'express';
import { getStats } from '../controllers/about.controller.js';

const router = express.Router();

// GET /api/animals/stats — live platform statistics
router.get('/stats', getStats);

export default router;
