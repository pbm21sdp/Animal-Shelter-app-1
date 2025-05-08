// controllers/pet.controller.js
import {PetModel} from '../models/pet.model.js';

export const getAllPets = async (req, res) => {
    try {
        const {type, city, zipCode, limit, showAll} = req.query;
        const filters = {};

        // Only add filters if they have values
        if (type && type !== 'any') filters.type = type;
        if (city) filters.city = city;
        if (zipCode) filters.zipCode = zipCode;

        // Only apply the availability filter for non-admin requests
        // This allows admins to see all pets regardless of adoption status
        if (showAll !== 'true') {
            filters.is_available = true;
        }

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
                message: 'PetModel not found'
            });
        }
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
        const petData = req.body;
        const newPet = await PetModel.create(petData);

        res.status(201).json({
            success: true,
            message: 'PetModel created successfully',
            pet: newPet
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
        const updateData = req.body;

        const updatedPet = await PetModel.update(id, updateData);
        if (!updatedPet) {
            return res.status(404).json({
                success: false,
                message: 'PetModel not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'PetModel updated successfully',
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