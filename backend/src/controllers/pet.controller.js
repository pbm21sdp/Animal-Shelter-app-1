// controllers/pet.controller.js
import { PetModel } from '../models/pet.model.js';
import { Adoption } from '../models/adoption.model.js';
import { pool } from '../config/database/connectPostgresDB.js';
import { User } from '../models/user.model.js';

export const getAllPets = async (req, res) => {
    try {
        const {type, city, zipCode, limit, showAll, adopted, uploader_id} = req.query;
        const filters = {};

        // Only add filters if they have values
        if (type && type !== 'any') filters.type = type;
        if (city) filters.city = city;
        if (zipCode) filters.zipCode = zipCode;
        if (uploader_id) filters.uploader_id = uploader_id;

        // Skip availability filter when explicitly fetching adopted pets
        // (adopted pets have is_available = false by definition)
        if (showAll !== 'true' && adopted !== 'true') {
            filters.is_available = true;
        }

        // Moderation filter: show only approved pets on the public feed.
        // Exceptions: a user viewing their own listings, or an admin requesting all pets.
        const isViewingOwnListings = uploader_id && uploader_id === req.userId;
        const isAdminViewingAll = showAll === 'true' && req.isAdmin === true;
        if (!isViewingOwnListings && !isAdminViewingAll) {
            filters.status = 'approved';
        }

        // Optional: ?adopted=true → only community-adopted, ?adopted=false → only not adopted
        if (adopted === 'true')  filters.is_adopted = true;
        if (adopted === 'false') filters.is_adopted = false;

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
                message: 'Pet not found'
            });
        }

        // Moderation gate — non-approved listings visible only to uploader or admin
        if (pet.status !== 'approved') {
            if (!req.isAdmin && pet.uploader_id !== req.userId) {
                return res.status(404).json({ success: false, message: 'Pet not found' });
            }
        }

        // If pet is not available, check access
        if (pet.adoption_status !== 'available') {
            // Admin can always access
            if (req.isAdmin) {
                return res.status(200).json({ success: true, pet });
            }

            // Adopted pets are visible to everyone — they're public happy endings
            if (pet.is_adopted || pet.adoption_status === 'adopted') {
                return res.status(200).json({ success: true, pet });
            }

            // Uploader can always view their own listing
            if (req.userId && pet.uploader_id === req.userId) {
                return res.status(200).json({ success: true, pet });
            }

            // Check if logged-in user has an adoption for this pet
            if (req.userId) {
                try {
                    const adoption = await Adoption.findOne({
                        user: req.userId,
                        petId: parseInt(req.params.id),
                        status: { $in: ['pending', 'in_review', 'approved'] }
                    });
                    if (adoption) {
                        return res.status(200).json({ success: true, pet });
                    }
                } catch (error) {
                    console.error('Error checking user adoptions:', error);
                }
            }

            // Not authorized to view this pet
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }

        // Pet is available - everyone can view
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

const REQUIRED_PET_FIELDS = ['name', 'type', 'description', 'gender', 'situation', 'current_status', 'microchip_status', 'neutered_spayed_status', 'vaccination_status'];

export const createPet = async (req, res) => {
    try {
        const missing = REQUIRED_PET_FIELDS.filter(f => !req.body[f]);
        const hasLocation = req.body.location_city || req.body.location_address;
        if (!hasLocation) missing.push('location_city');
        if (missing.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missing.join(', ')}`,
            });
        }

        const petData = { ...req.body, uploader_id: req.userId };
        const newPet = await PetModel.create(petData);

        res.status(201).json({
            success: true,
            message: 'Pet created successfully',
            pet: { id: newPet.id, ...newPet }
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

        const missing = REQUIRED_PET_FIELDS.filter(f => req.body[f] !== undefined && !req.body[f]);
        const bodyHasLocation = 'location_city' in req.body || 'location_address' in req.body;
        if (bodyHasLocation && !req.body.location_city && !req.body.location_address) {
            missing.push('location_city');
        }
        if (missing.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missing.join(', ')}`,
            });
        }

        // Ownership check — uploader or admin
        const existing = await PetModel.findById(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Pet not found' });
        }
        const isOwner = existing.uploader_id && existing.uploader_id === req.userId;
        if (!isOwner && !req.isAdmin) {
            return res.status(403).json({ success: false, message: 'Forbidden — only the uploader or an admin can edit this listing' });
        }

        // Non-admin uploaders always trigger re-moderation on edit
        const updateBody = { ...req.body };
        if (isOwner && !req.isAdmin) {
            updateBody.status = 'pending';
        }

        const updatedPet = await PetModel.update(id, updateBody);
        if (!updatedPet) {
            return res.status(404).json({ success: false, message: 'Pet not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Pet updated successfully',
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
        const { id } = req.params;
        const check = await pool.query('SELECT uploader_id FROM pets WHERE id = $1', [id]);
        if (check.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Pet not found' });
        }
        if (check.rows[0].uploader_id !== req.userId && !req.isAdmin) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        await pool.query('DELETE FROM pet_photos WHERE pet_id = $1', [id]);
        await pool.query('DELETE FROM pet_traits WHERE pet_id = $1', [id]);
        await pool.query('DELETE FROM saved_animals WHERE pet_id = $1', [id]);
        await pool.query('DELETE FROM pets WHERE id = $1', [id]);
        res.json({ success: true, message: 'Pet deleted successfully' });
    } catch (error) {
        console.error('deletePet error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// PATCH /api/pets/:id/adopt
// Marks a pet as community-adopted. Requires authentication.
// Ownership check: req.userId must match pet.uploader_id (field added in migration).
// Until uploader_id is populated, only admins can mark pets as adopted.
export const adoptPet = async (req, res) => {
    try {
        const { id } = req.params;

        const pet = await PetModel.findById(id);
        if (!pet) {
            return res.status(404).json({ success: false, message: 'Pet not found' });
        }

        const isOwner = pet.uploader_id && pet.uploader_id === req.userId;
        if (!isOwner && !req.isAdmin) {
            return res.status(403).json({ success: false, message: 'Forbidden — only the uploader or an admin can mark this animal as adopted' });
        }

        const { adoptedById, adopterExternalName } = req.body;
        const updated = await PetModel.adoptPet(id, adoptedById || null, adopterExternalName || null);
        res.status(200).json({ success: true, message: 'Pet marked as adopted', pet: updated });
    } catch (error) {
        console.error('Error in adoptPet:', error);
        res.status(500).json({ success: false, message: 'Failed to mark pet as adopted', error: error.message });
    }
};

// PATCH /api/pets/:id/found
// Marks a missing pet as returned to its owner. Does NOT set is_adopted — won't appear in Community.
export const markPetAsFound = async (req, res) => {
    try {
        const { id } = req.params;
        const pet = await PetModel.findById(id);
        if (!pet) return res.status(404).json({ success: false, message: 'Pet not found' });

        const isOwner = pet.uploader_id && pet.uploader_id === req.userId;
        if (!isOwner && !req.isAdmin) {
            return res.status(403).json({ success: false, message: 'Forbidden — only the uploader or an admin can update this animal' });
        }

        const updated = await PetModel.markAsFound(id);
        res.status(200).json({ success: true, message: 'Pet marked as found/returned home', pet: updated });
    } catch (error) {
        console.error('Error in markPetAsFound:', error);
        res.status(500).json({ success: false, message: 'Failed to mark pet as found', error: error.message });
    }
};

// PATCH /api/pets/:id/return
// Marks an adopted pet as returned — preserves adoption history, re-lists the animal.
export const returnPet = async (req, res) => {
    try {
        const { id } = req.params;
        const pet = await PetModel.findById(id);
        if (!pet) return res.status(404).json({ success: false, message: 'Pet not found' });

        const isOwner = pet.uploader_id && pet.uploader_id === req.userId;
        if (!isOwner && !req.isAdmin) {
            return res.status(403).json({ success: false, message: 'Forbidden — only the uploader or an admin can update this animal' });
        }
        if (!pet.is_adopted) {
            return res.status(400).json({ success: false, message: 'Pet is not marked as adopted' });
        }

        const updated = await PetModel.returnPet(id);
        res.status(200).json({ success: true, message: 'Pet marked as returned', pet: updated });
    } catch (error) {
        console.error('Error in returnPet:', error);
        res.status(500).json({ success: false, message: 'Failed to mark pet as returned', error: error.message });
    }
};

// PATCH /api/pets/:id/unadopt
// Reverses a community-adopted mark (e.g. uploader correction). Same auth rules.
export const unadoptPet = async (req, res) => {
    try {
        const { id } = req.params;

        const pet = await PetModel.findById(id);
        if (!pet) {
            return res.status(404).json({ success: false, message: 'Pet not found' });
        }

        const isOwner = pet.uploader_id && pet.uploader_id === req.userId;
        if (!isOwner && !req.isAdmin) {
            return res.status(403).json({ success: false, message: 'Forbidden — only the uploader or an admin can update this animal' });
        }

        const updated = await PetModel.unadoptPet(id);
        res.status(200).json({ success: true, message: 'Pet adoption mark reversed', pet: updated });
    } catch (error) {
        console.error('Error in unadoptPet:', error);
        res.status(500).json({ success: false, message: 'Failed to reverse adoption mark', error: error.message });
    }
};

// GET /api/pets/admin/pending — admin only
export const getPendingPets = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.*,
                   (SELECT pp.id FROM pet_photos pp WHERE pp.pet_id = p.id AND pp.is_primary = true LIMIT 1) as primary_photo_id,
                   (SELECT json_agg(json_build_object(
                       'id', pp.id, 'pet_id', pp.pet_id,
                       'photo_name', pp.photo_name, 'content_type', pp.content_type,
                       'photo_url', pp.photo_url, 'is_primary', pp.is_primary,
                       'created_at', pp.created_at
                   ) ORDER BY pp.is_primary DESC, pp.created_at ASC)
                    FROM pet_photos pp WHERE pp.pet_id = p.id) as photos,
                   (SELECT json_agg(DISTINCT pt.trait) FROM pet_traits pt WHERE pt.pet_id = p.id) as traits
            FROM pets p
            WHERE p.status = 'pending'
            ORDER BY p.created_at ASC
        `);

        const pets = result.rows;

        // Enrich with uploader name/email from MongoDB
        const uploaderIds = [...new Set(pets.map(p => p.uploader_id).filter(Boolean))];
        if (uploaderIds.length > 0) {
            try {
                const users = await User.find(
                    { _id: { $in: uploaderIds } },
                    { name: 1, email: 1 }
                ).lean();
                const userMap = Object.fromEntries(users.map(u => [u._id.toString(), u]));
                for (const pet of pets) {
                    const u = pet.uploader_id ? userMap[pet.uploader_id] : null;
                    pet.uploader_name  = u?.name  || null;
                    pet.uploader_email = u?.email || null;
                }
            } catch (mongoErr) {
                console.warn('[pending] MongoDB uploader lookup failed:', mongoErr.message);
            }
        }

        res.status(200).json({ success: true, pets });
    } catch (error) {
        console.error('Error fetching pending pets:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch pending pets', error: error.message });
    }
};

// PATCH /api/pets/:id/approve — admin only
export const approvePet = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `UPDATE pets SET status = 'approved', reviewed_by = $1, reviewed_at = NOW()
             WHERE id = $2 RETURNING *`,
            [req.userId, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Pet not found' });
        }
        const pet = result.rows[0];
        if (pet.uploader_id) {
            await pool.query(
                `INSERT INTO notifications (user_id, type, related_animal_id, message)
                 VALUES ($1, 'animal_approved', $2, $3)`,
                [pet.uploader_id, pet.id, `Your listing "${pet.name}" has been approved and is now visible to all users.`]
            );
        }
        res.status(200).json({ success: true, message: 'Pet approved successfully', pet });
    } catch (error) {
        console.error('Error approving pet:', error);
        res.status(500).json({ success: false, message: 'Failed to approve pet', error: error.message });
    }
};

// PATCH /api/pets/:id/reject — admin only
export const rejectPet = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        if (!reason || !reason.trim()) {
            return res.status(400).json({ success: false, message: 'Rejection reason is required' });
        }
        const result = await pool.query(
            `UPDATE pets SET status = 'rejected', rejection_reason = $1, reviewed_by = $2, reviewed_at = NOW()
             WHERE id = $3 RETURNING *`,
            [reason.trim(), req.userId, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Pet not found' });
        }
        const pet = result.rows[0];
        if (pet.uploader_id) {
            await pool.query(
                `INSERT INTO notifications (user_id, type, related_animal_id, message)
                 VALUES ($1, 'animal_rejected', $2, $3)`,
                [pet.uploader_id, pet.id, `Your listing "${pet.name}" was not approved. Reason: ${reason.trim()}`]
            );
        }
        res.status(200).json({ success: true, message: 'Pet rejected successfully', pet });
    } catch (error) {
        console.error('Error rejecting pet:', error);
        res.status(500).json({ success: false, message: 'Failed to reject pet', error: error.message });
    }
};

// GET /api/pets/admin/moderation-stats — admin only
export const getModerationStats = async (req, res) => {
    try {
        const [rateRes, reasonsRes, avgRes, queueRes, incompleteRes, activityRes, topUploadersRes, activeUsersRes, overviewRes] = await Promise.all([
            // 1. Approval/rejection rate
            pool.query(`
                SELECT
                    COUNT(*) FILTER (WHERE status = 'approved') AS approved,
                    COUNT(*) FILTER (WHERE status = 'rejected') AS rejected
                FROM pets WHERE status IN ('approved', 'rejected')
            `),
            // 2. Common rejection reasons
            pool.query(`
                SELECT rejection_reason, COUNT(*)::int AS count
                FROM pets
                WHERE status = 'rejected' AND rejection_reason IS NOT NULL AND rejection_reason != ''
                GROUP BY rejection_reason ORDER BY count DESC LIMIT 10
            `),
            // 3. Avg review time in hours
            pool.query(`
                SELECT AVG(EXTRACT(EPOCH FROM (reviewed_at - created_at)) / 3600) AS avg_hours
                FROM pets
                WHERE status IN ('approved', 'rejected') AND reviewed_at IS NOT NULL AND created_at IS NOT NULL
            `),
            // 4. Queue: pending count + oldest pending
            pool.query(`
                SELECT COUNT(*)::int AS pending_count, MIN(created_at) AS oldest_pending
                FROM pets WHERE status = 'pending'
            `),
            // 5. Incomplete approved animals (no photos or empty description)
            pool.query(`
                SELECT p.id, p.name, p.type, p.created_at,
                       (SELECT COUNT(*)::int FROM pet_photos pp WHERE pp.pet_id = p.id) AS photo_count
                FROM pets p
                WHERE p.status = 'approved'
                  AND (
                      (SELECT COUNT(*) FROM pet_photos pp WHERE pp.pet_id = p.id) = 0
                      OR p.description IS NULL OR TRIM(p.description) = ''
                  )
                ORDER BY p.created_at DESC LIMIT 20
            `),
            // 6. Recent posting activity
            pool.query(`
                SELECT
                    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::int                      AS today,
                    COUNT(*) FILTER (WHERE created_at >= date_trunc('week', NOW()))::int          AS this_week,
                    COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW()))::int         AS this_month
                FROM pets
            `),
            // 7+8. Top uploaders by number of pets
            pool.query(`
                SELECT uploader_id, COUNT(*)::int AS pet_count
                FROM pets WHERE uploader_id IS NOT NULL
                GROUP BY uploader_id ORDER BY pet_count DESC LIMIT 10
            `),
            // Active uploaders count
            pool.query(`
                SELECT COUNT(DISTINCT uploader_id)::int AS active_uploaders
                FROM pets WHERE uploader_id IS NOT NULL
            `),
            // 9. Overview totals
            pool.query(`
                SELECT
                    COUNT(*)::int                                              AS total,
                    COUNT(*) FILTER (WHERE status = 'pending')::int           AS pending,
                    COUNT(*) FILTER (WHERE status = 'approved')::int          AS approved,
                    COUNT(*) FILTER (WHERE status = 'rejected')::int          AS rejected
                FROM pets
            `),
        ]);

        // Enrich top uploaders with MongoDB names
        const uploaderIds = topUploadersRes.rows.map(r => r.uploader_id).filter(Boolean);
        let userMap = {};
        let totalUsersCount = 0;
        try {
            const [users, count] = await Promise.all([
                User.find({ _id: { $in: uploaderIds } }, { name: 1, email: 1 }).lean(),
                User.countDocuments(),
            ]);
            userMap = Object.fromEntries(users.map(u => [u._id.toString(), u]));
            totalUsersCount = count;
        } catch (mongoErr) {
            console.warn('[getModerationStats] MongoDB lookup failed:', mongoErr.message);
        }

        const activeUploaders = activeUsersRes.rows[0].active_uploaders || 0;
        const avgHours = parseFloat(avgRes.rows[0].avg_hours);
        const rate = rateRes.rows[0];
        const approved = parseInt(rate.approved) || 0;
        const rejected = parseInt(rate.rejected) || 0;

        res.json({
            success: true,
            stats: {
                approvalRate: {
                    approved,
                    rejected,
                    total: approved + rejected,
                    approvalPercent: approved + rejected > 0 ? Math.round((approved / (approved + rejected)) * 100) : 0,
                },
                rejectionReasons: reasonsRes.rows,
                avgReviewHours: isNaN(avgHours) ? null : Math.round(avgHours * 10) / 10,
                queue: {
                    pendingCount: queueRes.rows[0].pending_count || 0,
                    oldestPending: queueRes.rows[0].oldest_pending || null,
                },
                incompleteAnimals: incompleteRes.rows,
                recentActivity: activityRes.rows[0],
                userActivity: {
                    activeUploaders,
                    totalUsers: totalUsersCount,
                    inactiveCount: Math.max(0, totalUsersCount - activeUploaders),
                    activePercent: totalUsersCount > 0 ? Math.round((activeUploaders / totalUsersCount) * 100) : 0,
                },
                topUploaders: topUploadersRes.rows.map(r => ({
                    userId: r.uploader_id,
                    name:   userMap[r.uploader_id]?.name  || 'Unknown user',
                    email:  userMap[r.uploader_id]?.email || null,
                    petCount: r.pet_count,
                })),
                overview: overviewRes.rows[0],
            },
        });
    } catch (error) {
        console.error('Error in getModerationStats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch moderation stats', error: error.message });
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