// models/pet.model.js
import { pool } from '../config/database/connectPostgresDB.js';

export const PetModel = {
    // Get all available pets
    findAll: async (filters = {}) => {
        try {
            let query = `
                SELECT p.*,
                       json_agg(DISTINCT pp.*) FILTER (WHERE pp.id IS NOT NULL) as photos,
                    json_agg(DISTINCT pt.trait) FILTER (WHERE pt.id IS NOT NULL) as traits
                FROM pets p
                         LEFT JOIN pet_photos pp ON p.id = pp.pet_id
                         LEFT JOIN pet_traits pt ON p.id = pt.pet_id
                WHERE p.is_available = true
            `;

            const values = [];
            let paramCount = 1;

            if (filters.type && filters.type !== 'any') {
                query += ` AND p.type = $${paramCount}`;
                values.push(filters.type);
                paramCount++;
            }

            if (filters.city) {
                query += ` AND p.location_city = $${paramCount}`;
                values.push(filters.city);
                paramCount++;
            }

            if (filters.zipCode) {
                query += ` AND p.zip_code = $${paramCount}`;
                values.push(filters.zipCode);
                paramCount++;
            }

            query += ` GROUP BY p.id ORDER BY p.created_at DESC`;

            const result = await pool.query(query, values);

            return result.rows || [];
        } catch (error) {
            console.error('Error in PetModel.findAll:', error);
            throw error;
        }
    },

    // Search pets
    search: async (searchParams) => {
        try {
            let query = `
                SELECT p.*,
                       json_agg(DISTINCT pp.*) FILTER (WHERE pp.id IS NOT NULL) as photos,
                    json_agg(DISTINCT pt.trait) FILTER (WHERE pt.id IS NOT NULL) as traits
                FROM pets p
                         LEFT JOIN pet_photos pp ON p.id = pp.pet_id
                         LEFT JOIN pet_traits pt ON p.id = pt.pet_id
                WHERE p.is_available = true
            `;

            const values = [];
            let paramCount = 1;

            if (searchParams.type && searchParams.type !== 'any') {
                query += ` AND p.type = $${paramCount}`;
                values.push(searchParams.type);
                paramCount++;
            }

            // Handle radius and zipCode together
            if (searchParams.radius && searchParams.zipCode) {
                // For now, simple zip code exact match
                // You can implement more complex radius search using PostGIS if needed
                query += ` AND p.zip_code = $${paramCount}`;
                values.push(searchParams.zipCode);
                paramCount++;
            } else if (searchParams.zipCode) {
                // If only zipCode is provided
                query += ` AND p.zip_code = $${paramCount}`;
                values.push(searchParams.zipCode);
                paramCount++;
            }

            // Add sorting
            if (searchParams.sortBy === 'newest') {
                query += ` GROUP BY p.id ORDER BY p.created_at DESC`;
            } else if (searchParams.sortBy === 'oldest') {
                query += ` GROUP BY p.id ORDER BY p.created_at ASC`;
            } else {
                // Default to newest
                query += ` GROUP BY p.id ORDER BY p.created_at DESC`;
            }

            const result = await pool.query(query, values);
            return result.rows || [];
        } catch (error) {
            console.error('Error in PetModel.search:', error);
            throw error;
        }
    },

    // Get pet by ID
    findById: async (id) => {
        try {
            const query = `
                SELECT p.*,
                       json_agg(DISTINCT pp.*) FILTER (WHERE pp.id IS NOT NULL) as photos,
                    json_agg(DISTINCT pt.trait) FILTER (WHERE pt.id IS NOT NULL) as traits
                FROM pets p
                         LEFT JOIN pet_photos pp ON p.id = pp.pet_id
                         LEFT JOIN pet_traits pt ON p.id = pt.pet_id
                WHERE p.id = $1
                GROUP BY p.id
            `;

            const result = await pool.query(query, [id]);
            return result.rows[0];
        } catch (error) {
            console.error('Error in PetModel.findById:', error);
            throw error;
        }
    },

    // Get similar pets
    findSimilar: async (petId) => {
        try {
            const query = `
                WITH current_pet AS (
                    SELECT type, breed, age_category
                    FROM pets
                    WHERE id = $1
                )
                SELECT p.*,
                       json_agg(DISTINCT pp.*) FILTER (WHERE pp.id IS NOT NULL) as photos
                FROM pets p
                         LEFT JOIN pet_photos pp ON p.id = pp.pet_id
                WHERE p.is_available = true
                  AND p.id != $1
                  AND (p.type = (SELECT type FROM current_pet)
                   OR p.breed = (SELECT breed FROM current_pet))
                GROUP BY p.id
                    LIMIT 4
            `;

            const result = await pool.query(query, [petId]);
            return result.rows;
        } catch (error) {
            console.error('Error in PetModel.findSimilar:', error);
            throw error;
        }
    },

    // Create a new pet
    create: async (petData) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const {
                name, type, breed, age_category, gender, size, color, coat,
                fee, description, health_status, story, location_address,
                location_city, location_country, shelter_contact_email,
                shelter_contact_phone, traits, photos, zip_code // Added zip_code
            } = petData;

            // Insert pet
            const petQuery = `
                INSERT INTO pets (
                    name, type, breed, age_category, gender, size, color, coat,
                    fee, description, health_status, story, location_address,
                    location_city, location_country, shelter_contact_email,
                    shelter_contact_phone, zip_code
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
                    RETURNING *
            `;

            const petValues = [
                name, type, breed, age_category, gender, size, color, coat,
                fee, description, health_status, story, location_address,
                location_city, location_country, shelter_contact_email,
                shelter_contact_phone, zip_code
            ];

            const petResult = await client.query(petQuery, petValues);
            const newPet = petResult.rows[0];

            // Insert traits if provided
            if (traits && traits.length > 0) {
                const traitQuery = `
                    INSERT INTO pet_traits (pet_id, trait)
                    VALUES ($1, $2)
                `;
                for (const trait of traits) {
                    await client.query(traitQuery, [newPet.id, trait]);
                }
            }

            // Insert photos if provided
            if (photos && photos.length > 0) {
                const photoQuery = `
                    INSERT INTO pet_photos (pet_id, photo_url, is_primary)
                    VALUES ($1, $2, $3)
                `;
                for (let i = 0; i < photos.length; i++) {
                    const isPrimary = i === 0; // First photo is primary
                    await client.query(photoQuery, [newPet.id, photos[i], isPrimary]);
                }
            }

            await client.query('COMMIT');

            // Fetch the complete pet data with relations
            return await PetModel.findById(newPet.id);
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error in PetModel.create:', error);
            throw error;
        } finally {
            client.release();
        }
    },

    // Update a pet
    update: async (id, updateData) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const fields = [];
            const values = [];
            let paramCount = 1;

            // Dynamic update query builder
            Object.keys(updateData).forEach(key => {
                if (key !== 'traits' && key !== 'photos' && updateData[key] !== undefined) {
                    fields.push(`${key} = $${paramCount}`);
                    values.push(updateData[key]);
                    paramCount++;
                }
            });

            if (fields.length > 0) {
                values.push(id);
                const updateQuery = `
                    UPDATE pets
                    SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
                    WHERE id = $${paramCount}
                        RETURNING *
                `;

                await client.query(updateQuery, values);
            }

            // Update traits if provided
            if (updateData.traits) {
                // Remove existing traits
                await client.query('DELETE FROM pet_traits WHERE pet_id = $1', [id]);

                // Add new traits
                if (updateData.traits.length > 0) {
                    const traitQuery = `
                        INSERT INTO pet_traits (pet_id, trait)
                        VALUES ($1, $2)
                    `;
                    for (const trait of updateData.traits) {
                        await client.query(traitQuery, [id, trait]);
                    }
                }
            }

            // Update photos if provided
            if (updateData.photos) {
                // Remove existing photos
                await client.query('DELETE FROM pet_photos WHERE pet_id = $1', [id]);

                // Add new photos
                if (updateData.photos.length > 0) {
                    const photoQuery = `
                        INSERT INTO pet_photos (pet_id, photo_url, is_primary)
                        VALUES ($1, $2, $3)
                    `;
                    for (let i = 0; i < updateData.photos.length; i++) {
                        const isPrimary = i === 0;
                        await client.query(photoQuery, [id, updateData.photos[i], isPrimary]);
                    }
                }
            }

            await client.query('COMMIT');

            // Fetch the updated pet data with relations
            return await PetModel.findById(id);
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error in PetModel.update:', error);
            throw error;
        } finally {
            client.release();
        }
    },

    // Delete a pet (soft delete by setting is_available to false)
    delete: async (id) => {
        try {
            const query = `
                DELETE FROM pets
                WHERE id = $1
                RETURNING *
            `;

            const result = await pool.query(query, [id]);
            return result.rows[0];
        } catch (error) {
            console.error('Error in PetModel.delete:', error);
            throw error;
        }
    }

};