import express from 'express';
import {
    getAllPosts,
    getPostById,
    getPostPhoto,
    createPost,
    updatePost,
    deletePost,
} from '../controllers/forum.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { isAdmin } from '../middleware/adminCheck.js';
import { upload } from '../handlers/dbPhotoUpload.js';

const router = express.Router();

// Public read routes
router.get('/posts',                getAllPosts);
router.get('/posts/:id',            getPostById);
router.get('/posts/:id/photos/:photoId', getPostPhoto);

// Admin-only write routes
router.post('/posts',   verifyToken, isAdmin, upload.array('photos', 10), createPost);
router.put('/posts/:id',    verifyToken, isAdmin, updatePost);
router.delete('/posts/:id', verifyToken, isAdmin, deletePost);

export default router;
