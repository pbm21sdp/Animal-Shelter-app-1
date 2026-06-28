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
    returnPet,
    markPetAsFound,
    getPendingPets,
    approvePet,
    rejectPet,
    getModerationStats,
} from '../controllers/pet.controller.js';
import {
    uploadPhoto,
    getPhotoById,
    getPetPhotos,
    deletePhoto,
    setPrimaryPhoto
} from '../controllers/photo.controller.js';
import { verifyToken, optionalVerifyToken } from '../middleware/verifyToken.js';
import { isAdmin } from '../middleware/adminCheck.js';
import { upload } from '../handlers/dbPhotoUpload.js';

const router = express.Router();

// Public routes - anyone can access these
router.get('/suggestions', getSearchSuggestions); // This must come BEFORE /:id routes
router.get('/search', searchPets);
router.get('/', optionalVerifyToken, getAllPets);

// Admin moderation routes — must come BEFORE /:id to avoid route shadowing
router.get('/admin/pending',           verifyToken, isAdmin, getPendingPets);
router.get('/admin/moderation-stats',  verifyToken, isAdmin, getModerationStats);
router.patch('/:id/approve', verifyToken, isAdmin, approvePet);
router.patch('/:id/reject',  verifyToken, isAdmin, rejectPet);

// ID-based routes
router.get('/:id/similar', getSimilarPets);
router.get('/:id', optionalVerifyToken, getPetById);

// Photo routes
router.get('/photos/:photoId', getPhotoById); // Public route to fetch photos
router.get('/:petId/photos', getPetPhotos); // Get all photos for a pet

// Community adopt/unadopt/return/found — authenticated users (ownership enforced in controller)
router.patch('/:id/adopt',   verifyToken, adoptPet);
router.patch('/:id/unadopt', verifyToken, unadoptPet);
router.patch('/:id/return',  verifyToken, returnPet);
router.patch('/:id/found',   verifyToken, markPetAsFound);

// Authenticated users can create; patch for owners, admin-only for full update/delete
router.post('/', verifyToken, createPet);
router.patch('/:id', verifyToken, updatePet);
router.put('/:id', verifyToken, isAdmin, updatePet);
router.delete('/:id', verifyToken, deletePet);

// Photo upload — authenticated users (uploader or admin); ownership enforced in controller
router.post('/:id/photos', verifyToken, upload.single('photo'), uploadPhoto);
router.delete('/:petId/photos/:photoId', verifyToken, deletePhoto);
router.put('/:petId/photos/:photoId/primary', verifyToken, isAdmin, setPrimaryPhoto);

export default router;