-- Migration: add_adopted_fields_to_pets
-- Adds community-level adoption tracking fields to the pets table.
-- These are separate from the formal adoption_status workflow managed by admins.

ALTER TABLE pets ADD COLUMN IF NOT EXISTS is_adopted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS adopted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Note: uploader_id (VARCHAR referencing MongoDB user _id) should be added in a
-- separate migration once the upload flow stores the submitting user's identity.
-- The /adopt and /unadopt endpoints perform an ownership check against this field.

COMMENT ON COLUMN pets.is_adopted IS 'True when the community uploader marks the animal as having found a home';
COMMENT ON COLUMN pets.adopted_at  IS 'Timestamp when is_adopted was last set to TRUE';
