import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import {checkIfAdmin, isAdmin} from '../middleware/adminCheck.js';
import {
    submitAdoptionApplication,
    getUserAdoptions,
    getAdoptionDetails,
    getAllAdoptions,
    updateAdoptionStatus,
    deleteAdoption,
    getUserAdoptionsByUserId,
    checkForPet, getUserAdoptionsByPetId, getAdoptionDetailsAdmin
} from '../controllers/adoption.controller.js';

const router = express.Router();

// User routes
router.post('/', verifyToken, submitAdoptionApplication);
router.get('/user', verifyToken, getUserAdoptions);
router.get('/check/:petId', verifyToken, checkForPet);

// These routes use isAdmin to block non-admins
router.get('/admin', verifyToken, isAdmin, getAllAdoptions);
router.get('/admin/user/:userId', verifyToken, isAdmin, getUserAdoptionsByUserId);
router.put('/admin/:adoptionId', verifyToken, isAdmin, updateAdoptionStatus);
router.delete('/admin/:adoptionId', verifyToken, isAdmin, deleteAdoption);
router.get('/admin/details/:adoptionId', verifyToken, isAdmin, getAdoptionDetailsAdmin);

// Add this before your /:adoptionId route to avoid conflicts
router.get('/user/pet', verifyToken, getUserAdoptionsByPetId);

// This must be the last route since it has a parameter that will match anything
router.get('/:adoptionId', verifyToken, checkIfAdmin, getAdoptionDetails);

export default router;