
-- Add adoption_status field to pets table
ALTER TABLE pets ADD COLUMN adoption_status VARCHAR(20) DEFAULT 'available';

-- Create an index for better performance
CREATE INDEX idx_pets_adoption_status ON pets(adoption_status);

-- Add a comment explaining the relationship between is_available and adoption_status
COMMENT ON COLUMN pets.adoption_status IS 'Status of adoption process: available, pending, review, adopted';
COMMENT ON COLUMN pets.is_available IS 'Boolean indicating if pet is available for adoption (false when adopted or pending)';

-- Create a function to automatically update is_available based on adoption_status
CREATE OR REPLACE FUNCTION update_is_available()
    RETURNS TRIGGER AS $$
BEGIN
    IF NEW.adoption_status = 'available' THEN
        NEW.is_available := TRUE;
    ELSE
        NEW.is_available := FALSE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function before insert or update
CREATE TRIGGER set_is_available
    BEFORE INSERT OR UPDATE ON pets
    FOR EACH ROW
EXECUTE FUNCTION update_is_available();