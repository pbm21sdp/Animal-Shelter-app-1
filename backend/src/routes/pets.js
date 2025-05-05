// routes/pets.js
import express from 'express';
import {
    getAllPets,
    searchPets,
    getPetById,
    getSimilarPets,
    createPet,
    updatePet,
    deletePet,
    getSearchSuggestions
} from '../controllers/pet.controller.js';
import {
    uploadPhoto,
    getPhotoById,
    getPetPhotos,
    deletePhoto,
    setPrimaryPhoto
} from '../controllers/photo.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { isAdmin } from '../middleware/adminCheck.js';
import { upload } from '../handlers/dbPhotoUpload.js';

const router = express.Router();

// Public routes - anyone can access these
router.get('/suggestions', getSearchSuggestions); // This must come BEFORE /:id routes
router.get('/search', searchPets);
router.get('/', getAllPets);

// ID-based routes
router.get('/:id/similar', getSimilarPets);
router.get('/:id', getPetById);

// Photo routes
router.get('/photos/:photoId', getPhotoById); // Public route to fetch photos
router.get('/:petId/photos', getPetPhotos); // Get all photos for a pet

// Admin-only routes - only admin users (from MongoDB) can access these
// Authentication uses MongoDB, but data operations use PostgreSQL
router.post('/', verifyToken, isAdmin, createPet);
router.put('/:id', verifyToken, isAdmin, updatePet);
router.delete('/:id', verifyToken, isAdmin, deletePet);

// Admin photo management routes
router.post('/:id/photos', verifyToken, isAdmin, upload.single('photo'), uploadPhoto);
router.delete('/:petId/photos/:photoId', verifyToken, isAdmin, deletePhoto);
router.put('/:petId/photos/:photoId/primary', verifyToken, isAdmin, setPrimaryPhoto);

export default router;