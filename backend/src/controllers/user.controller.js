// controllers/user.controller.js
import { User } from '../models/user.model.js';

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