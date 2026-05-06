-- Migration: add_profile_fields
-- Adds uploader tracking, community adoption tracking, and saved animals feature.
-- Run once against the paws_db PostgreSQL database.

-- 1. Track which MongoDB user uploaded each pet
ALTER TABLE pets ADD COLUMN IF NOT EXISTS uploader_id VARCHAR(30);

-- 2. Track which MongoDB user adopted (marked as found home) each pet
ALTER TABLE pets ADD COLUMN IF NOT EXISTS adopted_by VARCHAR(30);

-- 3. Saved / bookmarked animals per user
CREATE TABLE IF NOT EXISTS saved_animals (
    id         SERIAL PRIMARY KEY,
    user_id    VARCHAR(30)  NOT NULL,                            -- MongoDB user _id
    pet_id     INTEGER      REFERENCES pets(id) ON DELETE CASCADE,
    created_at TIMESTAMP    DEFAULT NOW(),
    UNIQUE(user_id, pet_id)
);

-- Indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_pets_uploader_id  ON pets(uploader_id);
CREATE INDEX IF NOT EXISTS idx_pets_adopted_by   ON pets(adopted_by);
CREATE INDEX IF NOT EXISTS idx_saved_user_id     ON saved_animals(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_pet_id      ON saved_animals(pet_id);
