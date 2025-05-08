// Update the adoption schema model to include additional fields from the form

import mongoose from 'mongoose';

const adoptionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    petId: {
        type: Number,  // PostgreSQL pet ID (integer)
        required: true
    },
    petName: {
        type: String,
        required: true
    },
    petType: {
        type: String,
        required: true
    },
    petBreed: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'in_review', 'approved', 'rejected'],
        default: 'pending'
    },
    applicationDate: {
        type: Date,
        default: Date.now
    },
    notes: {
        type: String
    },
    adminNotes: {
        type: String
    },

    // Questions for the adoption application
    livingArrangement: {
        type: String
    },
    hasChildren: {
        type: Boolean
    },
    hasOtherPets: {
        type: Boolean
    },
    otherPetsDetails: {
        type: String
    },
    veterinarianInfo: {
        type: String
    },
    adoptionReason: {
        type: String
    },
    timeAvailability: {
        type: String
    },
    homeVisitAgreement: {
        type: Boolean,
        default: false
    },

    // Additional fields from the new form
    fullName: {
        type: String
    },
    email: {
        type: String
    },
    phone: {
        type: String
    },
    address: {
        type: String
    },
    city: {
        type: String
    },
    postalCode: {
        type: String
    },
    housingType: {
        type: String
    },
    hasYard: {
        type: String
    },
    children: {
        type: String
    },
    otherPets: {
        type: String
    },
    previousPetExperience: {
        type: String
    },
    message: {
        type: String
    }
}, { timestamps: true });

// Create indexes for better performance
adoptionSchema.index({ user: 1 });
adoptionSchema.index({ petId: 1 });
adoptionSchema.index({ status: 1 });

export const Adoption = mongoose.model('Adoption', adoptionSchema);