// routes/user.routes.js
import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { isAdmin } from '../middleware/adminCheck.js';
import {
    getUserProfile,
    updateUserProfile,
    getAllUsers,
    getUserById,
    updateUserAdminStatus,
    uploadAvatar,
    upload,
    getUserMessages,
    getUserAdoptionRequests
} from '../controllers/user.controller.js';

const router = express.Router();

// User routes (authenticated)
router.get('/profile', verifyToken, getUserProfile);
router.put('/profile', verifyToken, updateUserProfile);
router.post('/avatar', verifyToken, upload.single('avatar'), uploadAvatar);

// User messages and adoption requests
router.get('/messages', verifyToken, getUserMessages);
router.get('/adoptions', verifyToken, getUserAdoptionRequests);

// Admin routes
router.get('/admin', verifyToken, isAdmin, getAllUsers);
router.get('/admin/:userId', verifyToken, isAdmin, getUserById);
router.put('/admin/:userId/toggle-admin', verifyToken, isAdmin, updateUserAdminStatus);

export default router;