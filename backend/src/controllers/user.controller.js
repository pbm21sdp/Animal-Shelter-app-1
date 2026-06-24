// controllers/user.controller.js
import { User } from '../models/user.model.js';
import { pool } from '../config/database/connectPostgresDB.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get directory name properly with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

// Configure multer for avatar uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(uploadsDir, 'avatars');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const safeUserId = (req.userId || 'user').toString().replace(/[^a-zA-Z0-9]/g, '');
    cb(null, `avatar-${safeUserId}-${uniqueSuffix}${path.extname(file.originalname)}`);
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
            // Get absolute path by joining the root directory with the relative path
            // Example: '/uploads/avatars/file.jpg' -> '/path/to/project/uploads/avatars/file.jpg'
            const oldAvatarPath = path.join(
                __dirname,
                '..',
                user.avatar.replace(/^\/uploads/, 'uploads')
            );

            // Check if file exists before attempting to delete
            if (fs.existsSync(oldAvatarPath)) {
                fs.unlinkSync(oldAvatarPath);
            }
        }

        // Generate correct URL path for the avatar
        // Important: The path must start with / for correct URL formatting
        const avatarUrlPath = `/uploads/avatars/${path.basename(req.file.path)}`;

        // Update user avatar
        user.avatar = avatarUrlPath;
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

// ─────────────────────────────────────────────────────────────────────────────
// Privacy helpers
// ─────────────────────────────────────────────────────────────────────────────

const PRIVACY_DEFAULTS = {
    showAvgResponse:      true,
    showMessagesReceived: true,
    showUploads:          true,
    showAdoptedByMe:      true,
    showSaved:            true,
};

async function getPrivacySettingsFor(userId) {
    try {
        const user = await User.findById(userId).select('privacySettings');
        if (!user) return null;
        const ps = user.privacySettings || {};
        return {
            showAvgResponse:      ps.showAvgResponse      ?? true,
            showMessagesReceived: ps.showMessagesReceived ?? true,
            showUploads:          ps.showUploads          ?? true,
            showAdoptedByMe:      ps.showAdoptedByMe      ?? true,
            showSaved:            ps.showSaved            ?? true,
        };
    } catch {
        return null;
    }
}

function isOwnerRequest(req, targetId) {
    return req.userId && req.userId.toString() === targetId.toString();
}

// GET /api/users/me/privacy-settings
export const getPrivacySettings = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('privacySettings');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        const ps = user.privacySettings || {};
        res.json({ success: true, settings: { ...PRIVACY_DEFAULTS, ...ps.toObject?.() || ps } });
    } catch (err) {
        console.error('getPrivacySettings error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// PUT /api/users/me/privacy-settings
export const updatePrivacySettings = async (req, res) => {
    try {
        const allowed = ['showAvgResponse', 'showMessagesReceived', 'showUploads', 'showAdoptedByMe', 'showSaved'];
        const updates = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) {
                updates[`privacySettings.${key}`] = Boolean(req.body[key]);
            }
        }
        if (Object.keys(updates).length === 0)
            return res.status(400).json({ success: false, message: 'No valid settings provided' });

        await User.findByIdAndUpdate(req.userId, { $set: updates }, { new: true });
        const user = await User.findById(req.userId).select('privacySettings');
        const ps = user.privacySettings || {};
        res.json({ success: true, message: 'Privacy settings updated', settings: { ...PRIVACY_DEFAULTS, ...ps.toObject?.() || ps } });
    } catch (err) {
        console.error('updatePrivacySettings error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /api/users/:id/avg-response-time
export const getAvgResponseTime = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id.match(/^[0-9a-fA-F]{24}$/))
            return res.status(400).json({ success: false, message: 'Invalid user ID' });

        if (!isOwnerRequest(req, id)) {
            const settings = await getPrivacySettingsFor(id);
            if (settings && settings.showAvgResponse === false)
                return res.json({ success: true, isPrivate: true });
        }

        const result = await pool.query(
            `SELECT
                AVG(EXTRACT(EPOCH FROM (cm.replied_at - cm.created_at)) / 60) AS avg_minutes,
                COUNT(*) AS response_count
             FROM conversation_messages cm
             JOIN conversations c ON c.id = cm.conversation_id
             WHERE (c.participant_one = $1 OR c.participant_two = $1)
               AND cm.sender_id != $1
               AND cm.replied_at IS NOT NULL`,
            [id]
        );

        const count      = parseInt(result.rows[0].response_count) || 0;
        const avgMinutes = count > 0 ? parseFloat(result.rows[0].avg_minutes) : null;

        res.json({
            success: true,
            hasEnoughData: count >= 1,
            avgMinutes: isNaN(avgMinutes) ? null : avgMinutes,
        });
    } catch (err) {
        console.error('getAvgResponseTime error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /api/users/:id/received-count  (profile-aware, privacy-checked version)
export const getReceivedCountForUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id.match(/^[0-9a-fA-F]{24}$/))
            return res.status(400).json({ success: false, message: 'Invalid user ID' });

        if (!isOwnerRequest(req, id)) {
            const settings = await getPrivacySettingsFor(id);
            if (settings && settings.showMessagesReceived === false)
                return res.json({ success: true, isPrivate: true });
        }

        const result = await pool.query(
            `SELECT COUNT(*) AS count FROM conversation_messages cm
             JOIN conversations c ON c.id = cm.conversation_id
             WHERE (c.participant_one = $1 OR c.participant_two = $1)
               AND cm.sender_id != $1`,
            [id]
        );
        res.json({ success: true, count: parseInt(result.rows[0].count) || 0 });
    } catch (err) {
        console.error('getReceivedCountForUser error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// Profile page endpoints
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/users/:id/profile — public profile with pet stats
export const getPublicUserProfile = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }

        const user = await User.findById(id).select('name avatar bio city contactAvailability createdAt privacySettings');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Aggregate pet stats from PostgreSQL
        const statsResult = await pool.query(
            `SELECT
                COUNT(*) AS uploads_count,
                COUNT(CASE WHEN is_adopted = true THEN 1 END) AS adopted_count
             FROM pets
             WHERE uploader_id = $1`,
            [id]
        );

        const uploadsCount = parseInt(statsResult.rows[0].uploads_count) || 0;
        const adoptedCount = parseInt(statsResult.rows[0].adopted_count) || 0;
        const successRate  = uploadsCount > 0
            ? Math.round((adoptedCount / uploadsCount) * 100)
            : 0;

        const ps = user.privacySettings || {};
        res.status(200).json({
            success: true,
            profile: {
                id:                  user._id,
                name:                user.name,
                avatar:              user.avatar,
                bio:                 user.bio,
                city:                user.city,
                contactAvailability: user.contactAvailability,
                createdAt:           user.createdAt,
                uploads_count:       uploadsCount,
                adopted_count:       adoptedCount,
                success_rate:        successRate,
                privacySettings: {
                    showAvgResponse:      ps.showAvgResponse      ?? true,
                    showMessagesReceived: ps.showMessagesReceived ?? true,
                    showUploads:          ps.showUploads          ?? true,
                    showAdoptedByMe:      ps.showAdoptedByMe      ?? true,
                    showSaved:            ps.showSaved            ?? true,
                },
            },
        });
    } catch (error) {
        console.error('Error in getPublicUserProfile:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// PATCH /api/users/me — update bio, city, name for the authenticated user
export const updateMe = async (req, res) => {
    try {
        const { bio, city, name, contactAvailability } = req.body;

        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        if (bio  !== undefined) user.bio  = bio;
        if (city !== undefined) user.city = city;
        if (name !== undefined) user.name = name;
        if (contactAvailability !== undefined) user.contactAvailability = contactAvailability;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profile updated',
            user: {
                id:                  user._id,
                name:                user.name,
                bio:                 user.bio,
                city:                user.city,
                contactAvailability: user.contactAvailability,
            },
        });
    } catch (error) {
        console.error('Error in updateMe:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /api/users/:id/pets — pets uploaded by this user (uploader_id = id)
export const getUserPets = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isOwnerRequest(req, id)) {
            const settings = await getPrivacySettingsFor(id);
            if (settings && settings.showUploads === false)
                return res.json({ success: true, isPrivate: true, pets: [] });
        }

        const result = await pool.query(
            `SELECT p.id, p.name, p.type, p.breed, p.age_category,
                    p.adoption_status, p.is_adopted, p.adopted_at,
                    p.location_city, p.created_at, p.status,
                    pp.id AS primary_photo_id
             FROM pets p
             LEFT JOIN pet_photos pp ON pp.pet_id = p.id AND pp.is_primary = true
             WHERE p.uploader_id = $1
             ORDER BY p.created_at DESC`,
            [id]
        );

        res.status(200).json({ success: true, pets: result.rows });
    } catch (error) {
        console.error('Error in getUserPets:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /api/users/:id/adoptions — pets this user marked as adopted (adopted_by = id)
export const getUserAdoptedPets = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isOwnerRequest(req, id)) {
            const settings = await getPrivacySettingsFor(id);
            if (settings && settings.showAdoptedByMe === false)
                return res.json({ success: true, isPrivate: true, pets: [] });
        }

        const result = await pool.query(
            `SELECT p.id, p.name, p.type, p.breed,
                    p.adoption_status, p.is_adopted, p.adopted_at,
                    p.location_city, p.created_at, p.uploader_id,
                    pp.id AS primary_photo_id
             FROM pets p
             LEFT JOIN pet_photos pp ON pp.pet_id = p.id AND pp.is_primary = true
             WHERE p.adopted_by = $1
             ORDER BY p.adopted_at DESC NULLS LAST`,
            [id]
        );

        res.status(200).json({ success: true, pets: result.rows });
    } catch (error) {
        console.error('Error in getUserAdoptedPets:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /api/users/:id/saved — animals saved/bookmarked by this user
export const getUserSavedPets = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isOwnerRequest(req, id)) {
            const settings = await getPrivacySettingsFor(id);
            if (settings && settings.showSaved === false)
                return res.json({ success: true, isPrivate: true, pets: [] });
        }

        const result = await pool.query(
            `SELECT p.id, p.name, p.type, p.breed, p.age_category,
                    p.is_adopted, p.location_city, p.created_at,
                    sa.created_at AS saved_at,
                    pp.id AS primary_photo_id
             FROM saved_animals sa
             JOIN  pets p ON p.id = sa.pet_id
             LEFT JOIN pet_photos pp ON pp.pet_id = p.id AND pp.is_primary = true
             WHERE sa.user_id = $1
             ORDER BY sa.created_at DESC`,
            [id]
        );

        res.status(200).json({ success: true, pets: result.rows });
    } catch (error) {
        console.error('Error in getUserSavedPets:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// POST /api/users/me/saved/:petId — save/bookmark an animal
export const savePet = async (req, res) => {
    try {
        const { petId } = req.params;

        await pool.query(
            `INSERT INTO saved_animals (user_id, pet_id)
             VALUES ($1, $2)
             ON CONFLICT (user_id, pet_id) DO NOTHING`,
            [req.userId, petId]
        );

        res.status(200).json({ success: true, message: 'Pet saved' });
    } catch (error) {
        console.error('Error in savePet:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// DELETE /api/users/me/saved/:petId — remove a saved animal
export const unsavePet = async (req, res) => {
    try {
        const { petId } = req.params;

        await pool.query(
            `DELETE FROM saved_animals WHERE user_id = $1 AND pet_id = $2`,
            [req.userId, petId]
        );

        res.status(200).json({ success: true, message: 'Pet unsaved' });
    } catch (error) {
        console.error('Error in unsavePet:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /api/users/search?q= — search users by name or email
export const searchUsers = async (req, res) => {
    try {
        const q = (req.query.q || '').trim();
        if (q.length < 2) return res.json({ success: true, users: [] });

        const users = await User.find({
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } },
            ],
            isVerified: true,
        })
            .select('name email avatar')
            .limit(8);

        res.json({ success: true, users });
    } catch (error) {
        console.error('Error in searchUsers:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};