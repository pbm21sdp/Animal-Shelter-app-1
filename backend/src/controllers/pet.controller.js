// controllers/pet.controller.js
import {PetModel} from '../models/pet.model.js';
import { Adoption } from '../models/adoption.model.js';

export const getAllPets = async (req, res) => {
    try {
        const {type, city, zipCode, limit, showAll, adopted, uploader_id} = req.query;
        const filters = {};

        // Only add filters if they have values
        if (type && type !== 'any') filters.type = type;
        if (city) filters.city = city;
        if (zipCode) filters.zipCode = zipCode;
        if (uploader_id) filters.uploader_id = uploader_id;

        // Only apply the availability filter for non-admin requests
        // This allows admins to see all pets regardless of adoption status
        if (showAll !== 'true') {
            filters.is_available = true;
        }

        // Optional: ?adopted=true → only community-adopted, ?adopted=false → only not adopted
        if (adopted === 'true')  filters.is_adopted = true;
        if (adopted === 'false') filters.is_adopted = false;

        let pets = await PetModel.findAll(filters);

        // Apply limit if specified
        if (limit && !isNaN(parseInt(limit))) {
            pets = pets.slice(0, parseInt(limit));
        }

        res.status(200).json({
            success: true,
            pets
        });
    } catch (error) {
        console.error('Error fetching pets:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pets',
            error: error.message
        });
    }
};


// Update this method in your pet.controller.js
export const searchPets = async (req, res) => {
    try {
        // Extract all possible filter parameters
        const {
            type, radius, zipCode, sortBy, term,
            gender, ageCategory, size, color, breed
        } = req.query;

        // Create search parameters object with all possible filters
        const searchParams = {};

        // Only add search parameters if they have values and are not 'any'
        if (type && type !== 'any') searchParams.type = type;
        if (radius && radius !== '') searchParams.radius = radius;
        if (zipCode && zipCode !== '') searchParams.zipCode = zipCode;
        if (sortBy) searchParams.sortBy = sortBy;
        if (term) searchParams.term = term;

        // Add the additional filter parameters
        if (gender && gender !== 'any') searchParams.gender = gender;
        if (ageCategory && ageCategory !== 'any') searchParams.ageCategory = ageCategory;
        if (size && size !== 'any') searchParams.size = size;
        if (color && color !== '') searchParams.color = color;
        if (breed && breed !== '') searchParams.breed = breed;

        // console.log('Backend received search params:', searchParams);

        const pets = await PetModel.search(searchParams);

        res.status(200).json({
            success: true,
            totalCount: pets.length,
            pets
        });
    } catch (error) {
        console.error('Error searching pets:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search pets',
            error: error.message
        });
    }
};

export const getPetById = async (req, res) => {
    try {
        const pet = await PetModel.findById(req.params.id);
        if (!pet) {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }

        // If pet is not available (adopted or pending), check access
        if (pet.adoption_status !== 'available') {
            // Admin users can always access
            if (req.isAdmin) {
                return res.status(200).json({
                    success: true,
                    pet
                });
            }

            // Check if logged-in user has an adoption for this pet
            if (req.userId) {
                try {
                    const adoption = await Adoption.findOne({
                        user: req.userId,
                        petId: parseInt(req.params.id),
                        status: { $in: ['pending', 'in_review', 'approved'] }
                    });

                    // If user has an adoption for this pet, allow access
                    if (adoption) {
                        return res.status(200).json({
                            success: true,
                            pet
                        });
                    }
                } catch (error) {
                    console.error('Error checking user adoptions:', error);
                }
            }

            // Not authorized to view this pet
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }

        // Pet is available - everyone can view
        res.status(200).json({
            success: true,
            pet
        });
    } catch (error) {
        console.error('Error fetching pet:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pet',
            error: error.message
        });
    }
};

export const getSimilarPets = async (req, res) => {
    try {
        const similarPets = await PetModel.findSimilar(req.params.id);
        res.status(200).json({
            success: true,
            pets: similarPets
        });
    } catch (error) {
        console.error('Error fetching similar pets:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch similar pets',
            error: error.message
        });
    }
};

export const createPet = async (req, res) => {
    try {
        const petData = { ...req.body, uploader_id: req.userId };
        const newPet = await PetModel.create(petData);

        res.status(201).json({
            success: true,
            message: 'Pet created successfully',
            pet: { id: newPet.id, ...newPet }
        });
    } catch (error) {
        console.error('Error creating pet:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create pet',
            error: error.message
        });
    }
};

export const updatePet = async (req, res) => {
    try {
        const {id} = req.params;

        // Ownership check — uploader or admin
        const existing = await PetModel.findById(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Pet not found' });
        }
        const isOwner = existing.uploader_id && existing.uploader_id === req.userId;
        if (!isOwner && !req.isAdmin) {
            return res.status(403).json({ success: false, message: 'Forbidden — only the uploader or an admin can edit this listing' });
        }

        const updatedPet = await PetModel.update(id, req.body);
        if (!updatedPet) {
            return res.status(404).json({ success: false, message: 'Pet not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Pet updated successfully',
            pet: updatedPet
        });
    } catch (error) {
        console.error('Error updating pet:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update pet',
            error: error.message
        });
    }
};

export const deletePet = async (req, res) => {
    try {
        const {id} = req.params;

        const result = await PetModel.delete(id);
        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'PetModel not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'PetModel deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting pet:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete pet',
            error: error.message
        });
    }
};

// PATCH /api/pets/:id/adopt
// Marks a pet as community-adopted. Requires authentication.
// Ownership check: req.userId must match pet.uploader_id (field added in migration).
// Until uploader_id is populated, only admins can mark pets as adopted.
export const adoptPet = async (req, res) => {
    try {
        const { id } = req.params;

        const pet = await PetModel.findById(id);
        if (!pet) {
            return res.status(404).json({ success: false, message: 'Pet not found' });
        }

        const isOwner = pet.uploader_id && pet.uploader_id === req.userId;
        if (!isOwner && !req.isAdmin) {
            return res.status(403).json({ success: false, message: 'Forbidden — only the uploader or an admin can mark this animal as adopted' });
        }

        const updated = await PetModel.adoptPet(id, req.userId);
        res.status(200).json({ success: true, message: 'Pet marked as adopted', pet: updated });
    } catch (error) {
        console.error('Error in adoptPet:', error);
        res.status(500).json({ success: false, message: 'Failed to mark pet as adopted', error: error.message });
    }
};

// PATCH /api/pets/:id/unadopt
// Reverses a community-adopted mark (e.g. uploader correction). Same auth rules.
export const unadoptPet = async (req, res) => {
    try {
        const { id } = req.params;

        const pet = await PetModel.findById(id);
        if (!pet) {
            return res.status(404).json({ success: false, message: 'Pet not found' });
        }

        const isOwner = pet.uploader_id && pet.uploader_id === req.userId;
        if (!isOwner && !req.isAdmin) {
            return res.status(403).json({ success: false, message: 'Forbidden — only the uploader or an admin can update this animal' });
        }

        const updated = await PetModel.unadoptPet(id);
        res.status(200).json({ success: true, message: 'Pet adoption mark reversed', pet: updated });
    } catch (error) {
        console.error('Error in unadoptPet:', error);
        res.status(500).json({ success: false, message: 'Failed to reverse adoption mark', error: error.message });
    }
};

export const getSearchSuggestions = async (req, res) => {
    try {
        const { term } = req.query;

        if (!term || term.length < 2) {
            return res.status(200).json({
                success: true,
                suggestions: []
            });
        }

        // Use the model function we'll create
        const suggestions = await PetModel.getSuggestions(term);

        res.status(200).json({
            success: true,
            suggestions
        });
    } catch (error) {
        console.error('Error getting search suggestions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get search suggestions',
            error: error.message
        });
    }
};