// controllers/donation.controller.js
import stripe from '../config/stripe/stripe.js';
import { Donation } from '../models/donation.model.js';
import { User } from '../models/user.model.js';

// Create a checkout session
export const createCheckoutSession = async (req, res) => {
    try {
        const { userId, email, amountInCents } = req.body;

        // Default to 1000 cents (€10) if no amount specified
        const amount = amountInCents || 1000;

        // Calculate amount in euros (for database)
        const amountInEuros = amount / 100;

        // Expire any old pending sessions for this user
        await expireOldSessions(userId);

        // Create Stripe checkout session with the specified amount and a shorter expiration
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: 'Donation to Paws',
                            description: 'Your contribution helps animals find their forever homes',
                        },
                        unit_amount: amount,
                    },
                    quantity: 1,
                },
            ],
            customer_email: email,
            success_url: `${process.env.CLIENT_URL}/donation-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/`,
            expires_at: Math.floor(Date.now() / 1000) + 1800, // 30 minutes from now
            metadata: {
                userId: userId,
                amountInEuros: amountInEuros.toString()
            },
        });

        // Create a pending donation record
        await Donation.create({
            user: userId,
            email: email,
            amount: amountInEuros,
            currency: 'eur',
            stripeSessionId: session.id,
            status: 'pending'
        });

        // Return both sessionId and URL
        res.status(200).json({
            success: true,
            sessionId: session.id,
            url: session.url
        });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create checkout session',
            error: error.message
        });
    }
};

// Expire old pending sessions
export const expireOldSessions = async (userId) => {
    try {
        // Find pending donation sessions that are older than 30 minutes
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

        const oldPendingSessions = await Donation.find({
            user: userId,
            status: 'pending',
            createdAt: { $lt: thirtyMinutesAgo }
        });

        // Expire each session in Stripe and update database
        for (const session of oldPendingSessions) {
            try {
                // Retrieve the session to check its status
                if (session.stripeSessionId) {
                    try {
                        const stripeSession = await stripe.checkout.sessions.retrieve(session.stripeSessionId);

                        // Only try to expire if it's still open
                        if (stripeSession.status === 'open') {
                            await stripe.checkout.sessions.expire(session.stripeSessionId);
                        }
                    } catch (stripeError) {
                        // If there's an error retrieving or expiring the session, log it
                        console.error(`Error expiring Stripe session ${session.stripeSessionId}:`, stripeError);
                    }
                }

                // Update the database record regardless
                session.status = 'canceled';
                await session.save();

                console.log(`Expired old session ${session.stripeSessionId} for user ${userId}`);
            } catch (expireError) {
                // If there's an error expiring a specific session, log it but continue with others
                console.error(`Error expiring session ${session.stripeSessionId}:`, expireError);
            }
        }

        return oldPendingSessions.length;
    } catch (error) {
        console.error('Error expiring old sessions:', error);
        return 0;
    }
};

// Handle Stripe webhook events
export const handleStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error(`Webhook signature verification failed:`, err);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        try {
            // Update donation record
            const donation = await Donation.findOne({ stripeSessionId: session.id });

            if (donation) {
                donation.status = 'completed';
                donation.paymentIntentId = session.payment_intent;
                await donation.save();

                console.log(`Donation completed for user: ${donation.email}`);
            }
        } catch (error) {
            console.error('Error updating donation status:', error);
        }
    }

    // Handle checkout.session.expired event
    if (event.type === 'checkout.session.expired') {
        const session = event.data.object;

        try {
            // Update donation record to canceled
            const donation = await Donation.findOne({ stripeSessionId: session.id });

            if (donation) {
                donation.status = 'canceled';
                await donation.save();

                console.log(`Donation session expired for user: ${donation.email}`);
            }
        } catch (error) {
            console.error('Error updating expired donation status:', error);
        }
    }

    // Return a 200 response to acknowledge receipt of the event
    res.status(200).json({ received: true });
};

// Get all donations (admin only)
export const getAllDonations = async (req, res) => {
    try {
        const donations = await Donation.find()
            .sort({ createdAt: -1 })
            .populate('user', 'name email');

        res.status(200).json({
            success: true,
            donations
        });
    } catch (error) {
        console.error('Error fetching all donations:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching donations'
        });
    }
};

// Get donations for the authenticated user
export const getUserDonations = async (req, res) => {
    try {
        const donations = await Donation.find({ user: req.userId })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            donations
        });
    } catch (error) {
        console.error('Error fetching user donations:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching donations'
        });
    }
};

// Get donations for a specific user (admin only)
export const getUserDonationsById = async (req, res) => {
    try {
        const { userId } = req.params;

        // Validate userId
        if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID format' });
        }

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Get donations
        const donations = await Donation.find({ user: userId }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            donations
        });
    } catch (error) {
        console.error('Error fetching user donations:', error);
        res.status(500).json({ success: false, message: 'Error fetching user donations' });
    }
};

// Verify a donation session
export const verifyDonation = async (req, res) => {
    try {
        const { sessionId } = req.params;

        // Find donation in our database
        const donation = await Donation.findOne({ stripeSessionId: sessionId });

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: 'Donation not found'
            });
        }

        // If it's not completed, check with Stripe
        if (donation.status !== 'completed') {
            try {
                const session = await stripe.checkout.sessions.retrieve(sessionId);

                if (session.payment_status === 'paid') {
                    donation.status = 'completed';
                    donation.paymentIntentId = session.payment_intent;
                    await donation.save();
                }
            } catch (stripeError) {
                console.error('Error verifying with Stripe:', stripeError);
            }
        }

        res.status(200).json({
            success: true,
            donation
        });
    } catch (error) {
        console.error('Error verifying donation:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying donation'
        });
    }
};

// Test function for cleaning up abandoned donations
export const cleanupAbandonedDonationsTest = async (req, res) => {
    try {
        // You can add a custom time threshold for testing
        const timeThreshold = req.query.minutes ? parseInt(req.query.minutes) : 1;
        const timeAgo = new Date(Date.now() - timeThreshold * 60 * 1000);

        console.log(`Finding pending donations older than ${timeThreshold} minute(s)`);

        const oldPendingDonations = await Donation.find({
            status: 'pending',
            createdAt: { $lt: timeAgo }
        });

        console.log(`Found ${oldPendingDonations.length} pending donations to clean up`);

        let expiredCount = 0;
        let processedDonations = [];
        let errors = [];

        // Process each old pending donation
        for (const donation of oldPendingDonations) {
            try {
                // Try to expire in Stripe (might already be expired)
                if (donation.stripeSessionId) {
                    try {
                        // Fetch the session first to check its status
                        const session = await stripe.checkout.sessions.retrieve(donation.stripeSessionId);

                        // Only try to expire if the session is still open
                        if (session.status === 'open') {
                            await stripe.checkout.sessions.expire(donation.stripeSessionId);
                            console.log(`Expired Stripe session: ${donation.stripeSessionId}`);
                        } else {
                            console.log(`Session ${donation.stripeSessionId} already has status: ${session.status}`);
                        }
                    } catch (stripeError) {
                        console.log(`Stripe error for session ${donation.stripeSessionId}: ${stripeError.message}`);
                        errors.push({
                            donationId: donation._id,
                            stripeSessionId: donation.stripeSessionId,
                            error: stripeError.message
                        });
                    }
                }

                // Update our record regardless of Stripe session status
                donation.status = 'canceled';
                await donation.save();
                expiredCount++;

                processedDonations.push({
                    id: donation._id,
                    email: donation.email,
                    amount: donation.amount,
                    stripeSessionId: donation.stripeSessionId,
                    createdAt: donation.createdAt
                });

            } catch (donationError) {
                console.error(`Error processing donation ${donation._id}:`, donationError);
                errors.push({
                    donationId: donation._id,
                    error: donationError.message
                });
            }
        }

        // Return detailed information for testing purposes
        res.status(200).json({
            success: true,
            expiredCount,
            timeThreshold: `${timeThreshold} minute(s)`,
            processedDonations,
            errors: errors.length > 0 ? errors : null,
            message: `Successfully cleaned up ${expiredCount} abandoned donations`
        });
    } catch (error) {
        console.error('Error cleaning up abandoned donations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clean up abandoned donations',
            error: error.message
        });
    }
};


export const updateDonation = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, status, createdAt } = req.body;

        // Validate donation ID
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid donation ID format'
            });
        }

        // Find the donation
        const donation = await Donation.findById(id);
        if (!donation) {
            return res.status(404).json({
                success: false,
                message: 'Donation not found'
            });
        }

        // Update fields
        if (amount !== undefined) donation.amount = amount;
        if (status !== undefined) donation.status = status;
        if (createdAt !== undefined) donation.createdAt = new Date(createdAt);

        // Save the updated donation
        await donation.save();

        res.status(200).json({
            success: true,
            donation
        });
    } catch (error) {
        console.error('Error updating donation:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating donation',
            error: error.message
        });
    }
};

// Delete a donation (admin only)
export const deleteDonation = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate donation ID
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid donation ID format'
            });
        }

        // Find and delete the donation
        const donation = await Donation.findByIdAndDelete(id);

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: 'Donation not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Donation deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting donation:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting donation',
            error: error.message
        });
    }
};