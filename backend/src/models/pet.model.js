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
    // Update the search function to handle the new suggestion format
    search: async (searchParams) => {
        try {
            // console.log('Search method received params:', searchParams);

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

            // Add type filter
            if (searchParams.type && searchParams.type !== 'any') {
                query += ` AND LOWER(p.type) = LOWER($${paramCount})`;
                values.push(searchParams.type);
                paramCount++;
            }

            // Handle radius and zipCode
            if (searchParams.radius && searchParams.zipCode) {
                query += ` AND p.zip_code = $${paramCount}`;
                values.push(searchParams.zipCode);
                paramCount++;
            } else if (searchParams.zipCode) {
                query += ` AND p.zip_code = $${paramCount}`;
                values.push(searchParams.zipCode);
                paramCount++;
            }

            // Add search term filter
            if (searchParams.term) {
                query += ` AND (
                LOWER(p.name) ILIKE LOWER($${paramCount}) OR 
                LOWER(p.breed) ILIKE LOWER($${paramCount}) OR 
                LOWER(p.description) ILIKE LOWER($${paramCount}) OR
                LOWER(p.type) ILIKE LOWER($${paramCount})
            )`;
                values.push(`%${searchParams.term}%`);
                paramCount++;
            }

            // Add gender filter
            if (searchParams.gender && searchParams.gender !== 'any') {
                query += ` AND LOWER(p.gender) = LOWER($${paramCount})`;
                values.push(searchParams.gender);
                paramCount++;
            }

            // Add age category filter
            if (searchParams.ageCategory && searchParams.ageCategory !== 'any') {
                query += ` AND LOWER(p.age_category) = LOWER($${paramCount})`;
                values.push(searchParams.ageCategory);
                paramCount++;
            }

            // Add size filter
            if (searchParams.size && searchParams.size !== 'any') {
                query += ` AND LOWER(p.size) = LOWER($${paramCount})`;
                values.push(searchParams.size);
                paramCount++;
            }

            // Add color filter
            if (searchParams.color) {
                query += ` AND LOWER(p.color) ILIKE LOWER($${paramCount})`;
                values.push(`%${searchParams.color}%`);
                paramCount++;
            }

            // Add breed filter
            if (searchParams.breed) {
                query += ` AND LOWER(p.breed) ILIKE LOWER($${paramCount})`;
                values.push(`%${searchParams.breed}%`);
                paramCount++;
            }

            // Add sorting
            if (searchParams.sortBy === 'newest') {
                query += ` GROUP BY p.id ORDER BY p.created_at DESC`;
            } else if (searchParams.sortBy === 'oldest') {
                query += ` GROUP BY p.id ORDER BY p.created_at ASC`;
            } else {
                // Default to nearest (could be enhanced with actual geo proximity)
                query += ` GROUP BY p.id ORDER BY p.created_at DESC`;
            }

            // console.log('Search query:', query);
            // console.log('Values:', values);

            const result = await pool.query(query, values);
            // console.log(`Found ${result.rows.length} matching pets`);
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
    },

    // Get search suggestions for autocomplete
    // Replace this method in your PetModel object
    getSuggestions: async (term) => {
        try {
            if (!term || term.length < 1) {
                return [];
            }

            // Query for pet names, breeds, and types that match the term
            const query = `
                SELECT id, name, type, breed
                FROM pets
                WHERE
                    name ILIKE $1 OR
                    breed ILIKE $1 OR
                    type ILIKE $1
                LIMIT 20
            `;

            const result = await pool.query(query, [`%${term}%`]);

            // Format suggestions in Emag style: primary text + category
            const suggestions = [];
            const uniqueValues = new Set();

            result.rows.forEach(row => {
                // Pet name suggestions
                if (row.name && row.name.toLowerCase().includes(term.toLowerCase())) {
                    const key = `name-${row.name}`;
                    if (!uniqueValues.has(key)) {
                        uniqueValues.add(key);
                        suggestions.push({
                            text: row.name,
                            category: row.type ? row.type.charAt(0).toUpperCase() + row.type.slice(1) : 'Pet'
                        });
                    }
                }

                // Breed suggestions
                if (row.breed && row.breed.toLowerCase().includes(term.toLowerCase())) {
                    const key = `breed-${row.breed}`;
                    if (!uniqueValues.has(key)) {
                        uniqueValues.add(key);
                        suggestions.push({
                            text: row.breed,
                            category: 'Breed'
                        });
                    }
                }

                // Type suggestions
                if (row.type && row.type.toLowerCase().includes(term.toLowerCase())) {
                    const key = `type-${row.type}`;
                    if (!uniqueValues.has(key)) {
                        uniqueValues.add(key);
                        suggestions.push({
                            text: row.type.charAt(0).toUpperCase() + row.type.slice(1),
                            category: 'Type'
                        });
                    }
                }
            });

            // Add direct search suggestion if no results or as additional option
            if (suggestions.length === 0 || term.length >= 3) {
                suggestions.push({
                    text: term,
                    category: 'Search'
                });
            }

            return suggestions.slice(0, 8); // Limit to 8 suggestions
        } catch (error) {
            console.error('Error in PetModel.getSuggestions:', error);
            return [{
                text: term,
                category: 'Search'
            }];
        }
    }


};