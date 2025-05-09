// models/scheduledMeeting.model.js
import mongoose from 'mongoose';

const scheduledMeetingSchema = new mongoose.Schema({
    adoptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Adoption',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    petId: {
        type: Number, // PostgreSQL pet ID
        required: true
    },
    petName: {
        type: String,
        required: true
    },
    scheduledDate: {
        type: Date,
        required: true
    },
    scheduledTime: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    notes: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    responseDate: {
        type: Date
    },
    adminMessage: {
        type: String
    }
}, { timestamps: true });

// Create indexes for better performance
scheduledMeetingSchema.index({ userId: 1 });
scheduledMeetingSchema.index({ adoptionId: 1 });
scheduledMeetingSchema.index({ status: 1 });

export const ScheduledMeeting = mongoose.model('ScheduledMeeting', scheduledMeetingSchema);