// controllers/user.controller.js
import { User } from '../models/user.model.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for avatar uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/avatars';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `avatar-${req.userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload only images.'), false);
    }
};

export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Get the current user's profile
export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password -verificationToken -verificationTokenExpiresAt -resetPasswordToken -resetPasswordExpiresAt');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Error in getUserProfile:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Update the current user's profile
export const updateUserProfile = async (req, res) => {
    try {
        const { name, email } = req.body;

        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Update fields if provided
        if (name) user.name = name;
        if (email && email !== user.email) {
            // Check if email is already in use
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ success: false, message: 'Email is already in use' });
            }
            user.email = email;
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                ...user._doc,
                password: undefined,
                verificationToken: undefined,
                verificationTokenExpiresAt: undefined,
                resetPasswordToken: undefined,
                resetPasswordExpiresAt: undefined
            }
        });
    } catch (error) {
        console.error('Error in updateUserProfile:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Upload user avatar
export const uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const user = await User.findById(req.userId);

        if (!user) {
            // Delete uploaded file
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Delete old avatar if exists
        if (user.avatar) {
            const oldAvatarPath = user.avatar.replace('/uploads/', 'uploads/');
            if (fs.existsSync(oldAvatarPath)) {
                fs.unlinkSync(oldAvatarPath);
            }
        }

        // Update user avatar
        user.avatar = `/uploads/avatars/${req.file.filename}`;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Avatar uploaded successfully',
            avatarUrl: user.avatar
        });
    } catch (error) {
        // Delete uploaded file if error
        if (req.file && req.file.path) {
            fs.unlinkSync(req.file.path);
        }
        console.error('Error in uploadAvatar:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get user's messages
export const getUserMessages = async (req, res) => {
    try {
        // This would need to be implemented with your message model
        // For now, returning mock data
        const messages = [
            {
                id: '1',
                subject: 'Question about Bella',
                recipient: 'shelter@example.com',
                content: 'I would like to know more about Bella\'s health history.',
                response: 'Bella is fully vaccinated and has no health issues.',
                createdAt: new Date('2024-01-15'),
                status: 'answered'
            }
        ];

        res.status(200).json({
            success: true,
            messages
        });
    } catch (error) {
        console.error('Error in getUserMessages:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get user's adoption requests
export const getUserAdoptionRequests = async (req, res) => {
    try {
        // This would need to be implemented with your adoption model
        // For now, returning mock data
        const adoptions = [
            {
                id: '1',
                petName: 'Max',
                petBreed: 'Golden Retriever',
                status: 'pending',
                notes: 'I have a large yard and experience with dogs.',
                createdAt: new Date('2024-01-20'),
                response: null
            }
        ];

        res.status(200).json({
            success: true,
            adoptions
        });
    } catch (error) {
        console.error('Error in getUserAdoptionRequests:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select('-password -verificationToken -verificationTokenExpiresAt -resetPasswordToken -resetPasswordExpiresAt')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            users
        });
    } catch (error) {
        console.error('Error in getAllUsers:', error);
        res.status(500).json({ success: false, message: 'Error fetching users' });
    }
};

// Get a specific user by ID (admin only)
export const getUserById = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID format' });
        }

        const user = await User.findById(userId)
            .select('-password -verificationToken -verificationTokenExpiresAt -resetPasswordToken -resetPasswordExpiresAt');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Error in getUserById:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Update a user's admin status (admin only)
export const updateUserAdminStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { isAdmin } = req.body;

        if (isAdmin === undefined) {
            return res.status(400).json({ success: false, message: 'isAdmin field is required' });
        }

        if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID format' });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Don't allow admin to remove their own admin status
        if (userId === req.userId && isAdmin === false) {
            return res.status(400).json({ success: false, message: 'You cannot remove your own admin status' });
        }

        user.isAdmin = isAdmin;
        await user.save();

        res.status(200).json({
            success: true,
            message: `User admin status updated to ${isAdmin}`,
            user: {
                ...user._doc,
                password: undefined,
                verificationToken: undefined,
                verificationTokenExpiresAt: undefined,
                resetPasswordToken: undefined,
                resetPasswordExpiresAt: undefined
            }
        });
    } catch (error) {
        console.error('Error in updateUserAdminStatus:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};