import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { isAdmin } from '../middleware/adminCheck.js';
import {
    createMessage,
    getAllMessages,
    markMessageAsRead,
    deleteMessage,
    replyToMessage,
    getUserMessages
} from '../controllers/message.controller.js';

const router = express.Router();

// Public route - anyone can send a message
router.post('/', createMessage);

// Admin routes - require authentication and admin role
router.get('/admin', verifyToken, isAdmin, getAllMessages);
router.put('/admin/:id/mark-read', verifyToken, isAdmin, markMessageAsRead);
router.delete('/admin/:id', verifyToken, isAdmin, deleteMessage);
router.post('/admin/reply', verifyToken, isAdmin, replyToMessage);
router.get('/admin/user/:userId', verifyToken, isAdmin, getUserMessages);

export default router;