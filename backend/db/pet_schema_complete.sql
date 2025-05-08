-- Create pets table
CREATE TABLE pets (
                      id SERIAL PRIMARY KEY,
                      name VARCHAR(100) NOT NULL,
                      type VARCHAR(50) NOT NULL, -- dog, cat, bird, other
                      breed VARCHAR(100),
                      age_category VARCHAR(20), -- puppy, young, adult, senior
                      gender VARCHAR(20), -- male, female
                      size VARCHAR(20), -- small, medium, large
                      color VARCHAR(50),
                      coat VARCHAR(50), -- short, long, medium
                      fee DECIMAL(10, 2),
                      description TEXT,
                      health_status TEXT,
                      story TEXT,
                      is_available BOOLEAN DEFAULT true,
                      location_address VARCHAR(255),
                      location_city VARCHAR(100),
                      location_country VARCHAR(100),
                      zip_code VARCHAR(20),
                      shelter_contact_email VARCHAR(255),
                      shelter_contact_phone VARCHAR(50),
                      adoption_status VARCHAR(20) DEFAULT 'available', -- available, pending, in_review, adopted
                      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create pet_photos table
CREATE TABLE pet_photos (
                            id SERIAL PRIMARY KEY,
                            pet_id INTEGER REFERENCES pets(id) ON DELETE CASCADE,
                            photo_data BYTEA, -- Binary image data
                            photo_name VARCHAR(255), -- Original filename
                            content_type VARCHAR(100), -- MIME type
                            photo_url VARCHAR(255), -- Kept for backwards compatibility
                            is_primary BOOLEAN DEFAULT false,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create pet_traits table for characteristics
CREATE TABLE pet_traits (
                            id SERIAL PRIMARY KEY,
                            pet_id INTEGER REFERENCES pets(id) ON DELETE CASCADE,
                            trait VARCHAR(100) NOT NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add documentation comments for important fields
COMMENT ON COLUMN pets.adoption_status IS 'Status of adoption process: available, pending, in_review, adopted';
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

-- Create indexes for better performance
CREATE INDEX idx_pets_type ON pets(type);
CREATE INDEX idx_pets_available ON pets(is_available);
CREATE INDEX idx_pets_location ON pets(location_city);
CREATE INDEX idx_pets_adoption_status ON pets(adoption_status);