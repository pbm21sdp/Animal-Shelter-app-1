import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { isAdmin } from '../middleware/adminCheck.js';
import {
    submitAdoptionApplication,
    getUserAdoptions,
    getAdoptionDetails,
    getAllAdoptions,
    updateAdoptionStatus,
    deleteAdoption,
    getUserAdoptionsByUserId,
    checkForPet
} from '../controllers/adoption.controller.js';

const router = express.Router();

// User routes
router.post('/', verifyToken, submitAdoptionApplication);
router.get('/user', verifyToken, getUserAdoptions);
router.get('/check/:petId', verifyToken, checkForPet);

// Admin routes - these should come BEFORE the /:adoptionId route
router.get('/admin/user/:userId', verifyToken, isAdmin, getUserAdoptionsByUserId);
router.get('/admin', verifyToken, isAdmin, getAllAdoptions);
router.put('/admin/:adoptionId', verifyToken, isAdmin, updateAdoptionStatus);
router.delete('/admin/:adoptionId', verifyToken, isAdmin, deleteAdoption);

// This must be the last route since it has a parameter that will match anything
router.get('/:adoptionId', verifyToken, getAdoptionDetails);

export default router;