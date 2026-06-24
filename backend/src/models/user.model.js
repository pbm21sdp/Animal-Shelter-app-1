import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    avatar: {
        type: String,
        default: null
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    bio: {
        type: String,
        default: null,
        maxlength: 500,
    },
    city: {
        type: String,
        default: null,
        maxlength: 100,
    },
    contactAvailability: {
        days: { type: [String], default: [] },
        from: { type: String, default: '' },
        to:   { type: String, default: '' },
    },
    privacySettings: {
        showAvgResponse:      { type: Boolean, default: true },
        showMessagesReceived: { type: Boolean, default: true },
        showUploads:          { type: Boolean, default: true },
        showAdoptedByMe:      { type: Boolean, default: true },
        showSaved:            { type: Boolean, default: true },
    },
    resetPasswordToken: String,
    resetPasswordExpiresAt: Date,
    verificationToken: String,
    verificationTokenExpiresAt: Date,
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);