import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import {
    startConversation,
    getConversations,
    getMessages,
    sendMessage,
    getUnreadCount,
    getReceivedCount,
    deleteConversation,
} from '../controllers/conversation.controller.js';

const router = express.Router();

router.post('/', verifyToken, startConversation);
router.get('/', verifyToken, getConversations);
router.get('/unread-count', verifyToken, getUnreadCount);
router.get('/received-count', verifyToken, getReceivedCount);
router.get('/:id/messages', verifyToken, getMessages);
router.post('/:id/messages', verifyToken, sendMessage);
router.delete('/:id', verifyToken, deleteConversation);

export default router;
