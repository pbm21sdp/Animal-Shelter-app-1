import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { isAdmin } from '../middleware/adminCheck.js';
import { getAdoptionPredictions } from '../controllers/prediction.controller.js';

const router = express.Router();

// Get adoption predictions
router.post('/adoptions', verifyToken, isAdmin, getAdoptionPredictions);

export default router;