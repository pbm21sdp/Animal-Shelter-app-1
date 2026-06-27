import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { isAdmin } from '../middleware/adminCheck.js';
import {
    getRejectReasons,
    toggleRejectReason,
    getForbiddenWords,
    addForbiddenWord,
    deleteForbiddenWord,
} from '../controllers/settings.controller.js';

const router = express.Router();

// Reject reasons — GET is accessible to all authenticated users (ModerationPanel reads it)
router.get('/reject-reasons', verifyToken, getRejectReasons);
router.patch('/reject-reasons/:id/toggle', verifyToken, isAdmin, toggleRejectReason);

// Forbidden words — admin only
router.get('/forbidden-words', verifyToken, isAdmin, getForbiddenWords);
router.post('/forbidden-words', verifyToken, isAdmin, addForbiddenWord);
router.delete('/forbidden-words/:id', verifyToken, isAdmin, deleteForbiddenWord);

export default router;
