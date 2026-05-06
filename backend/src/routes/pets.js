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
    getSearchSuggestions,
    adoptPet,
    unadoptPet,
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
router.get('/:id', verifyToken, getPetById);

// Photo routes
router.get('/photos/:photoId', getPhotoById); // Public route to fetch photos
router.get('/:petId/photos', getPetPhotos); // Get all photos for a pet

// Community adopt/unadopt — authenticated users (ownership enforced in controller)
router.patch('/:id/adopt',   verifyToken, adoptPet);
router.patch('/:id/unadopt', verifyToken, unadoptPet);

// Authenticated users can create; patch for owners, admin-only for full update/delete
router.post('/', verifyToken, createPet);
router.patch('/:id', verifyToken, updatePet);
router.put('/:id', verifyToken, isAdmin, updatePet);
router.delete('/:id', verifyToken, isAdmin, deletePet);

// Photo upload — authenticated users (uploader or admin); ownership enforced in controller
router.post('/:id/photos', verifyToken, upload.single('photo'), uploadPhoto);
router.delete('/:petId/photos/:photoId', verifyToken, isAdmin, deletePhoto);
router.put('/:petId/photos/:photoId/primary', verifyToken, isAdmin, setPrimaryPhoto);

export default router;