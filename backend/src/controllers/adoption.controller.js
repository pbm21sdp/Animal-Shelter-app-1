import { Adoption } from '../models/adoption.model.js';
import { User } from '../models/user.model.js';
import { PetModel } from '../models/pet.model.js';
import mongoose from 'mongoose';

// Submit adoption application
export const submitAdoptionApplication = async (req, res) => {
    try {
        const {
            petId,
            petName,
            petType,
            petBreed,
            // Add these fields to support both the old and new form format
            livingArrangement,  // from original form
            housingType,        // from the new form - maps to livingArrangement
            hasChildren,        // boolean or string 'yes'/'no'
            children,           // from new form - needs mapping
            hasOtherPets,       // boolean or string 'yes'/'no'
            otherPets,          // from new form - needs mapping
            otherPetsDetails,
            previousPetExperience, // Maps to otherPetsDetails if otherPetsDetails not provided
            veterinarianInfo,
            adoptionReason,
            message,            // Maps to adoptionReason if adoptionReason not provided
            timeAvailability,
            homeVisitAgreement,
            hasYard,            // Additional field from new form
            notes,
            // User information that might come from the form
            fullName,
            email,
            phone,
            address,
            city,
            postalCode
        } = req.body;

        // Validate required fields
        if (!petId || !petName || !petType) {
            return res.status(400).json({
                success: false,
                message: 'Missing required pet information'
            });
        }

        // Check if the pet exists and is available
        const pet = await PetModel.findById(petId);
        if (!pet) {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }

        if (pet.adoption_status !== 'available') {
            return res.status(400).json({
                success: false,
                message: 'This pet is not available for adoption'
            });
        }

        // Check if user already has a pending application for this pet
        const existingApplication = await Adoption.findOne({
            user: req.userId,
            petId: petId,
            status: { $in: ['pending', 'in_review'] }
        });

        if (existingApplication) {
            return res.status(400).json({
                success: false,
                message: 'You already have a pending application for this pet'
            });
        }

        // Format the values correctly - handle different form inputs
        // Convert to appropriate format for the database
        const processedHasChildren = typeof hasChildren === 'string'
            ? hasChildren === 'yes' || hasChildren === 'true'
            : !!hasChildren;

        const processedHasOtherPets = typeof hasOtherPets === 'string'
            ? hasOtherPets === 'yes' || hasOtherPets === 'true' || otherPets !== 'none'
            : !!hasOtherPets;

        const processedHomeVisitAgreement = typeof homeVisitAgreement === 'string'
            ? homeVisitAgreement === 'yes' || homeVisitAgreement === 'true'
            : !!homeVisitAgreement;

        // Determine living arrangement - use housingType if livingArrangement not provided
        const finalLivingArrangement = livingArrangement || housingType || '';

        // Determine other pets details - use previousPetExperience if otherPetsDetails not provided
        const finalOtherPetsDetails = otherPetsDetails ||
            (otherPets && otherPets !== 'none' ? otherPets : '') ||
            previousPetExperience || '';

        // Determine adoption reason - use message if adoptionReason not provided
        const finalAdoptionReason = adoptionReason || message || '';

        // Create adoption application
        const adoptionApplication = new Adoption({
            user: req.userId,
            petId,
            petName,
            petType,
            petBreed,
            livingArrangement: finalLivingArrangement,
            hasChildren: processedHasChildren,
            hasOtherPets: processedHasOtherPets,
            otherPetsDetails: finalOtherPetsDetails,
            veterinarianInfo,
            adoptionReason: finalAdoptionReason,
            timeAvailability,
            homeVisitAgreement: processedHomeVisitAgreement,
            notes,
            status: 'pending',
            // Store optional form fields that might be useful
            fullName,
            email,
            phone,
            address,
            city,
            postalCode,
            hasYard
        });

        await adoptionApplication.save();

        // Update pet status to pending
        await PetModel.updateAdoptionStatus(petId, 'pending');

        res.status(201).json({
            success: true,
            message: 'Adoption application submitted successfully',
            application: adoptionApplication
        });
    } catch (error) {
        console.error('Error submitting adoption application:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit adoption application',
            error: error.message
        });
    }
};

// Get user's adoption applications
export const getUserAdoptions = async (req, res) => {
    try {
        const adoptions = await Adoption.find({ user: req.userId })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            adoptions
        });
    } catch (error) {
        console.error('Error fetching user adoptions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch adoptions',
            error: error.message
        });
    }
};

// Get adoption application details
export const getAdoptionDetails = async (req, res) => {
    try {
        const { adoptionId } = req.params;

        // Validate MongoDB ID
        if (!mongoose.Types.ObjectId.isValid(adoptionId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid adoption ID format'
            });
        }

        // Use populate to get user details
        const adoption = await Adoption.findById(adoptionId).populate('user', 'name email');

        if (!adoption) {
            return res.status(404).json({
                success: false,
                message: 'Adoption application not found'
            });
        }

        // Check if user is authorized (either the applicant or an admin)
        // We need to check if user.id or user._id depending on how it's populated
        const adoptionUserId = typeof adoption.user === 'object' ?
            (adoption.user._id ? adoption.user._id.toString() : adoption.user.id ? adoption.user.id.toString() : '') :
            adoption.user ? adoption.user.toString() : '';

        if (adoptionUserId !== req.userId && !req.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this adoption application'
            });
        }

        res.status(200).json({
            success: true,
            adoption
        });
    } catch (error) {
        console.error('Error fetching adoption details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch adoption details',
            error: error.message
        });
    }
};


// Admin: Get all adoption applications
export const getAllAdoptions = async (req, res) => {
    try {
        // Get query parameters for filtering
        const { status, petType, sort = 'newest' } = req.query;

        // Build filter object
        const filters = {};

        // Only add filters if they have valid values (not 'all')
        if (status && status !== 'all') {
            filters.status = status;
        }

        if (petType && petType !== 'all') {
            filters.petType = petType;
        }

        // Determine sort order
        let sortOptions = {};
        if (sort === 'oldest') {
            sortOptions = { createdAt: 1 };
        } else if (sort === 'status') {
            sortOptions = { status: 1, createdAt: -1 };
        } else {
            // Default sort by newest
            sortOptions = { createdAt: -1 };
        }

        // Fetch adoptions with populated user data
        const adoptions = await Adoption.find(filters)
            .populate('user', 'name email')
            .sort(sortOptions);

        // Return the adoptions
        res.status(200).json({
            success: true,
            adoptions
        });
    } catch (error) {
        console.error('Error fetching all adoptions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch adoptions',
            error: error.message
        });
    }
};

// Admin: Update adoption status
export const updateAdoptionStatus = async (req, res) => {
    try {
        const { adoptionId } = req.params;
        const { status, adminNotes } = req.body;

        // Validate status
        const validStatuses = ['pending', 'in_review', 'approved', 'rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        // Find the adoption
        const adoption = await Adoption.findById(adoptionId);
        if (!adoption) {
            return res.status(404).json({
                success: false,
                message: 'Adoption application not found'
            });
        }

        // Update adoption in MongoDB
        adoption.status = status;
        if (adminNotes) {
            adoption.adminNotes = adminNotes;
        }
        await adoption.save();

        // Update pet status based on adoption status in PostgreSQL
        let petStatus;
        switch (status) {
            case 'approved':
                petStatus = 'adopted';
                break;
            case 'rejected':
                petStatus = 'available';
                break;
            case 'in_review':
                petStatus = 'pending';
                break;
            default:
                petStatus = 'pending';
        }

        // This is where the PetModel.updateAdoptionStatus method is called
        // It should update both adoption_status and is_available fields
        await PetModel.updateAdoptionStatus(adoption.petId, petStatus);

        res.status(200).json({
            success: true,
            message: 'Adoption status updated successfully',
            adoption
        });
    } catch (error) {
        console.error('Error updating adoption status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update adoption status',
            error: error.message
        });
    }
};

// Admin: Delete adoption application
export const deleteAdoption = async (req, res) => {
    try {
        const { adoptionId } = req.params;

        // Find the adoption
        const adoption = await Adoption.findById(adoptionId);
        if (!adoption) {
            return res.status(404).json({
                success: false,
                message: 'Adoption application not found'
            });
        }

        // Get pet ID before deletion
        const petId = adoption.petId;

        // Delete the adoption
        await Adoption.findByIdAndDelete(adoptionId);

        // Check if there are other pending applications for this pet
        const otherApplications = await Adoption.find({
            petId,
            status: { $in: ['pending', 'in_review'] }
        });

        // If no other applications, set pet back to available
        if (otherApplications.length === 0) {
            await PetModel.updateAdoptionStatus(petId, 'available');
        }

        res.status(200).json({
            success: true,
            message: 'Adoption application deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting adoption application:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete adoption application',
            error: error.message
        });
    }
};

// Get user adoptions by userId (admin only)
export const getUserAdoptionsByUserId = async (req, res) => {
    try {
        const { userId } = req.params;

        // Validate MongoDB ID
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Fetch user's adoptions
        const adoptions = await Adoption.find({ user: userId })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            adoptions
        });
    } catch (error) {
        console.error('Error fetching user adoptions by ID:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user adoptions',
            error: error.message
        });
    }
};


