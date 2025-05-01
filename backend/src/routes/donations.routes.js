// routes/donation.routes.js
import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { isAdmin } from '../middleware/adminCheck.js';
import {
    createCheckoutSession,
    handleStripeWebhook,
    getAllDonations,
    getUserDonations,
    getUserDonationsById,
    verifyDonation,
    updateDonation,
    deleteDonation,
    cleanupAbandonedDonationsTest
} from '../controllers/donation.controller.js';

const router = express.Router();

// Public webhook route (Stripe needs direct access)
router.post('/webhook', handleStripeWebhook);

// User donation routes
router.post('/create-checkout', verifyToken, createCheckoutSession);
router.get('/user', verifyToken, getUserDonations);
router.get('/verify/:sessionId', verifyToken, verifyDonation);

// Admin routes
router.get('/admin', verifyToken, isAdmin, getAllDonations);
router.get('/admin/user/:userId', verifyToken, isAdmin, getUserDonationsById);

// Admin cleanup routes
router.get('/admin/cleanup-abandoned', verifyToken, isAdmin, cleanupAbandonedDonationsTest);

// Conditionally add test endpoint only in development environment
if (process.env.NODE_ENV === 'development') {
    // Development version - Only requires authentication
    router.get('/test/cleanup-abandoned', verifyToken, cleanupAbandonedDonationsTest);
}

// Admin Delete and Update routes
router.put('/admin/:id', verifyToken, isAdmin, updateDonation);
router.delete('/admin/:id', verifyToken, isAdmin, deleteDonation);

// Alternative routes to match what your store is trying
router.put('/:id/admin', verifyToken, isAdmin, updateDonation);
router.delete('/:id/admin', verifyToken, isAdmin, deleteDonation);

export default router;