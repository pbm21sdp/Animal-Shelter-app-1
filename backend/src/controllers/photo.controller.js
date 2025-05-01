// controllers/photo.controller.js
import { pool } from '../config/database/connectPostgresDB.js';

// Upload a photo for a pet
export const uploadPhoto = async (req, res) => {
    try {
        const petId = req.params.id;

        // Check if pet exists
        const petResult = await pool.query('SELECT * FROM pets WHERE id = $1', [petId]);
        if (petResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No photo uploaded'
            });
        }

        // Check if this is the first photo (make it primary if so)
        const existingPhotos = await pool.query('SELECT * FROM pet_photos WHERE pet_id = $1', [petId]);
        const isPrimary = existingPhotos.rows.length === 0;

        // Insert binary data directly to PostgreSQL
        const query = `
            INSERT INTO pet_photos (pet_id, photo_data, photo_name, content_type, is_primary)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, pet_id, photo_name, is_primary, created_at
        `;

        const result = await pool.query(query, [
            petId,
            req.file.buffer,  // Binary data
            req.file.originalname,
            req.file.mimetype,
            isPrimary
        ]);

        res.status(201).json({
            success: true,
            message: 'Photo uploaded successfully',
            photo: result.rows[0]
        });
    } catch (error) {
        console.error('Error uploading photo:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload photo',
            error: error.message
        });
    }
};

// Get all photos for a pet
export const getPetPhotos = async (req, res) => {
    try {
        const { petId } = req.params;

        // Check if pet exists
        const petResult = await pool.query('SELECT * FROM pets WHERE id = $1', [petId]);
        if (petResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pet not found'
            });
        }

        // Get all photos for the pet (excluding binary data)
        const query = `
            SELECT id, pet_id, photo_name, is_primary, created_at 
            FROM pet_photos 
            WHERE pet_id = $1
            ORDER BY is_primary DESC, created_at DESC
        `;
        const result = await pool.query(query, [petId]);

        res.status(200).json({
            success: true,
            photos: result.rows
        });
    } catch (error) {
        console.error('Error fetching pet photos:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pet photos',
            error: error.message
        });
    }
};

// Delete a photo
export const deletePhoto = async (req, res) => {
    try {
        const { petId, photoId } = req.params;

        // Verify the photo belongs to the pet
        const photoQuery = await pool.query(
            'SELECT * FROM pet_photos WHERE id = $1 AND pet_id = $2',
            [photoId, petId]
        );

        if (photoQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Photo not found'
            });
        }

        const isPrimary = photoQuery.rows[0].is_primary;

        // Delete from database
        await pool.query('DELETE FROM pet_photos WHERE id = $1', [photoId]);

        // If this was the primary photo, make another photo primary
        if (isPrimary) {
            const nextPhotoQuery = await pool.query(
                'SELECT id FROM pet_photos WHERE pet_id = $1 ORDER BY created_at DESC LIMIT 1',
                [petId]
            );

            if (nextPhotoQuery.rows.length > 0) {
                await pool.query(
                    'UPDATE pet_photos SET is_primary = true WHERE id = $1',
                    [nextPhotoQuery.rows[0].id]
                );
            }
        }

        res.status(200).json({
            success: true,
            message: 'Photo deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting photo:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete photo',
            error: error.message
        });
    }
};

// Set a photo as primary
export const setPrimaryPhoto = async (req, res) => {
    try {
        const { petId, photoId } = req.params;

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Verify the photo belongs to the pet
            const photoExists = await client.query(
                'SELECT EXISTS(SELECT 1 FROM pet_photos WHERE id = $1 AND pet_id = $2)',
                [photoId, petId]
            );

            if (!photoExists.rows[0].exists) {
                await client.query('ROLLBACK');
                return res.status(404).json({
                    success: false,
                    message: 'Photo not found'
                });
            }

            // Reset all photos for this pet to non-primary
            await client.query(
                'UPDATE pet_photos SET is_primary = false WHERE pet_id = $1',
                [petId]
            );

            // Set the selected photo as primary
            const result = await client.query(
                'UPDATE pet_photos SET is_primary = true WHERE id = $1 AND pet_id = $2 RETURNING id, pet_id, photo_name, is_primary, created_at',
                [photoId, petId]
            );

            await client.query('COMMIT');

            res.status(200).json({
                success: true,
                message: 'Photo set as primary',
                photo: result.rows[0]
            });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error setting primary photo:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to set primary photo',
            error: error.message
        });
    }

};

// Get a photo by ID
export const getPhotoById = async (req, res) => {
    try {
        const { photoId } = req.params;

        const query = 'SELECT photo_data, content_type FROM pet_photos WHERE id = $1';
        const result = await pool.query(query, [photoId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Photo not found'
            });
        }

        const photo = result.rows[0];

        // Check if photo_data exists
        if (!photo.photo_data) {
            return res.status(404).json({
                success: false,
                message: 'Photo data is missing'
            });
        }

        // Validate content type
        let contentType = photo.content_type;

        // Default to a safe content type if it's missing or invalid
        if (!contentType || contentType.includes(',') || contentType.includes(';')) {
            contentType = 'application/octet-stream';
        }

        // Set appropriate headers
        res.set({
            'Content-Type': contentType,
            'Content-Length': photo.photo_data.length || 0
        });

        // Send the binary data directly
        return res.send(photo.photo_data);

    } catch (error) {
        console.error('Error fetching photo:', error);

        // Send a proper error response
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch photo',
            error: error.message
        });
    }
};