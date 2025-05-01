// models/donation.model.js
import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    email: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'eur'
    },
    stripeSessionId: {
        type: String
    },
    paymentIntentId: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'canceled', 'failed'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

export const Donation = mongoose.model('Donation', donationSchema);