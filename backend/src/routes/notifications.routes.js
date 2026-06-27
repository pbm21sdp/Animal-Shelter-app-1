import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
} from '../controllers/notifications.controller.js';

const router = express.Router();

// Static paths BEFORE dynamic :id route
router.get('/unread-count', verifyToken, getUnreadCount);
router.get('/', verifyToken, getNotifications);
router.patch('/read-all', verifyToken, markAllAsRead);
router.patch('/:id/read', verifyToken, markAsRead);

export default router;
