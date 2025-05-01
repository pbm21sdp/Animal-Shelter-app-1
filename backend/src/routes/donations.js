// routes/donations.js
import express from 'express';
import {
    createCheckoutSession,
    handleStripeWebhook,
    getAllDonations,
    getUserDonations,
    verifyDonation,
    cleanupAbandonedDonationsTest
} from '../controllers/donation.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { isAdmin } from '../middleware/adminCheck.js';

const router = express.Router();

// Create a checkout session
router.post('/create-checkout', verifyToken, createCheckoutSession);

// Handle webhook from Stripe (no token verification as it comes from Stripe)
router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

// Get all donations (admin only)
router.get('/admin', verifyToken, isAdmin, getAllDonations);

// Get current user's donations
router.get('/user', verifyToken, getUserDonations);

// Verify a donation session
router.get('/verify/:sessionId', verifyToken, verifyDonation);

// Production version - Admin protected
router.get('/admin/cleanup-abandoned', verifyToken, isAdmin, cleanupAbandonedDonationsTest);


export default router;