// models/donation.model.js
import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    email: {
        type: String,
        default: null
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
    displayPreference: {
        type: String,
        enum: ['name', 'anonymous', 'hidden'],
        default: 'name'
    },
    displayName: {
        type: String,
        default: null
    },
    note: {
        type: String,
        default: null,
        maxlength: 200,
        trim: true,
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

export const Donation = mongoose.model('Donation', donationSchema);