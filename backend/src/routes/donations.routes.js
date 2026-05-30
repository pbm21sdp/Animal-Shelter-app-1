// routes/donation.routes.js
import express from 'express';
import { verifyToken, optionalVerifyToken } from '../middleware/verifyToken.js';
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
    cleanupAbandonedDonationsTest,
    createDonationSession,
    getPublicDonationStats,
    updateDisplayPreference,
} from '../controllers/donation.controller.js';
import { sendDonationConfirmationEmail } from '../config/mailtrap/emails.js';

const router = express.Router();

// Public webhook route (Stripe needs direct access)
router.post('/webhook', handleStripeWebhook);

// Public routes (no auth required)
router.get('/public/stats', getPublicDonationStats);
router.patch('/session/:sessionId/preference', updateDisplayPreference);

// User donation routes
router.post('/create-session', optionalVerifyToken, createDonationSession);
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
    router.get('/test/cleanup-abandoned', verifyToken, cleanupAbandonedDonationsTest);

    // Test if Mailtrap email sending works at all
    router.get('/test/send-email/:email', async (req, res) => {
        try {
            await sendDonationConfirmationEmail(req.params.email, 25, 'Paws Community Fund');
            res.json({ success: true, message: `Test email sent to ${req.params.email}` });
        } catch (err) {
            res.json({ success: false, error: err.message });
        }
    });
}

// Admin Delete and Update routes
router.put('/admin/:id', verifyToken, isAdmin, updateDonation);
router.delete('/admin/:id', verifyToken, isAdmin, deleteDonation);

// Alternative routes to match what your store is trying
router.put('/:id/admin', verifyToken, isAdmin, updateDonation);
router.delete('/:id/admin', verifyToken, isAdmin, deleteDonation);

export default router;