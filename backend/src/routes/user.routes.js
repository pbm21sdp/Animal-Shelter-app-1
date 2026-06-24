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
    getUserAdoptionRequests,
    // Profile page
    getPublicUserProfile,
    updateMe,
    getUserPets,
    getUserAdoptedPets,
    getUserSavedPets,
    savePet,
    unsavePet,
    searchUsers,
    // Privacy & new profile endpoints
    getPrivacySettings,
    updatePrivacySettings,
    getAvgResponseTime,
    getReceivedCountForUser,
} from '../controllers/user.controller.js';

const router = express.Router();

// ── Authenticated user's own profile ─────────────────────────────────────────
router.get('/profile', verifyToken, getUserProfile);
router.put('/profile', verifyToken, updateUserProfile);
router.post('/avatar', verifyToken, (req, res, next) => {
    console.log('Avatar upload request received');
    console.log('Content-Type:', req.headers['content-type']);
    console.log('User ID:', req.userId);
    next();
}, upload.single('avatar'), (req, res, next) => {
    console.log('After multer - req.file:', req.file);
    next();
}, uploadAvatar);

// ── PATCH /me — update bio / city / name (must be before /:id routes) ────────
router.patch('/me', verifyToken, updateMe);

// ── Privacy settings (must be before /:id routes) ────────────────────────────
router.get('/me/privacy-settings', verifyToken, getPrivacySettings);
router.put('/me/privacy-settings', verifyToken, updatePrivacySettings);

// ── User search (must be before /:id routes) ─────────────────────────────────
router.get('/search', verifyToken, searchUsers);

// ── Saved animals — /me routes before /:id ───────────────────────────────────
router.post('/me/saved/:petId',   verifyToken, savePet);
router.delete('/me/saved/:petId', verifyToken, unsavePet);

// ── Legacy message / adoption request helpers ────────────────────────────────
router.get('/messages',  verifyToken, getUserMessages);
router.get('/adoptions', verifyToken, getUserAdoptionRequests);

// ── Public profile + sub-resources ───────────────────────────────────────────
router.get('/:id/profile',        getPublicUserProfile);           // no auth — public
router.get('/:id/pets',           verifyToken, getUserPets);
router.get('/:id/adoptions',      verifyToken, getUserAdoptedPets);
router.get('/:id/saved',          verifyToken, getUserSavedPets);
router.get('/:id/avg-response-time', verifyToken, getAvgResponseTime);
router.get('/:id/received-count', verifyToken, getReceivedCountForUser);

// ── Admin routes ──────────────────────────────────────────────────────────────
router.get('/admin',                      verifyToken, isAdmin, getAllUsers);
router.get('/admin/:userId',              verifyToken, isAdmin, getUserById);
router.put('/admin/:userId/toggle-admin', verifyToken, isAdmin, updateUserAdminStatus);

export default router;