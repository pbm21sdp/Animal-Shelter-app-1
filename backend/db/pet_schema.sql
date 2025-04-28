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
                      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

-- Create indexes for better performance
CREATE INDEX idx_pets_type ON pets(type);
CREATE INDEX idx_pets_available ON pets(is_available);
CREATE INDEX idx_pets_location ON pets(location_city);

-- Insert sample data with zip codes
INSERT INTO pets (name, type, breed, age_category, gender, size, color, coat, fee, description, is_available, location_city, location_country, zip_code) VALUES
                                                                                                                                                             ('Cinnamon', 'dog', 'Border Collie Mix', 'young', 'female', 'medium', 'brown', 'long', 50.00, 'A young, happy pup looking for an active family. Loves to run and play fetch.', true, 'Tampere', 'Finland', '33100'),
                                                                                                                                                             ('Bubbles', 'cat', 'Domestic Short Hair', 'kitten', 'female', 'small', 'calico', 'short', 30.00, 'Playful and affectionate kitten who loves to cuddle and chase toys.', true, 'Helsinki', 'Finland', '00100'),
                                                                                                                                                             ('Onyx', 'dog', 'Spitz', 'young', 'male', 'medium', 'white', 'long', 50.00, 'Friendly and energetic dog who loves to play in the snow.', true, 'Tampere', 'Finland', '33200'),
                                                                                                                                                             ('Lemonade', 'dog', 'Husky & Border Mix', 'puppy', 'male', 'small', 'multi', 'medium', 75.00, 'Cute and playful puppy who gets along with other pets and children.', true, 'Espoo', 'Finland', '02100'),
                                                                                                                                                             ('Pebbles', 'rabbit', 'American', 'adult', 'female', 'small', 'white', 'short', 25.00, 'Calm and gentle rabbit who enjoys being petted and eating fresh vegetables.', true, 'Helsinki', 'Finland', '00200'),
                                                                                                                                                             ('Gusto', 'dog', 'German Shepherd Mix', 'adult', 'male', 'large', 'brown', 'medium', 60.00, 'Well-trained and loyal dog looking for an experienced owner.', true, 'Vantaa', 'Finland', '01300'),
                                                                                                                                                             ('Neslon', 'dog', 'Labrador', 'senior', 'male', 'large', 'golden', 'short', 40.00, 'Sweet senior dog who loves gentle walks and lounging in the sun.', true, 'Tampere', 'Finland', '33500'),
                                                                                                                                                             ('Lyra', 'cat', 'Siamese Mix', 'adult', 'female', 'medium', 'cream', 'short', 35.00, 'Elegant and vocal cat who enjoys being the center of attention.', true, 'Espoo', 'Finland', '02200'),
                                                                                                                                                             ('Ellie', 'cat', 'American Bobtail', 'young', 'female', 'medium', 'tabby', 'medium', 40.00, 'Playful and curious cat with a distinctive bobbed tail.', true, 'Helsinki', 'Finland', '00300'),
                                                                                                                                                             ('Remy', 'cat', 'Domestic Shorthair', 'kitten', 'male', 'small', 'black', 'short', 30.00, 'Adventurous kitten who loves climbing and exploring.', true, 'Vantaa', 'Finland', '01400'),
                                                                                                                                                             ('Chip & Dale', 'guinea pig', 'American', 'adult', 'female', 'small', 'multi', 'short', 20.00, 'Bonded pair of guinea pigs who must be adopted together. They love fresh vegetables and hay.', true, 'Helsinki', 'Finland', '00400'),
                                                                                                                                                             ('Eeyore', 'rabbit', 'French Lop', 'adult', 'male', 'medium', 'grey', 'medium', 25.00, 'Gentle and calm rabbit who enjoys being petted and having his own space.', true, 'Tampere', 'Finland', '33600');

-- Insert more sample data
INSERT INTO pets (name, type, breed, age_category, gender, size, color, coat, fee, description, is_available, location_city, location_country, zip_code) VALUES
                                                                                                                                                             ('Indigo', 'bird', 'Budgerigar', 'adult', 'female', 'small', 'blue', 'feather', 15.00, 'Beautiful blue budgie who sings melodiously and is hand-tamed.', true, 'Helsinki', 'Finland', '00500'),
                                                                                                                                                             ('Laika', 'dog', 'Bernese Mix', 'adult', 'female', 'large', 'tricolor', 'long', 65.00, 'Gentle giant who loves children and other animals. Perfect family dog.', true, 'Espoo', 'Finland', '02300'),
                                                                                                                                                             ('Bravo', 'dog', 'Boxer Mix', 'senior', 'male', 'medium', 'brown', 'short', 45.00, 'Loyal and loving senior dog looking for a quiet home for his golden years.', true, 'Vantaa', 'Finland', '01500'),
                                                                                                                                                             ('Sarge', 'dog', 'German Shepherd Mix', 'adult', 'male', 'large', 'black/tan', 'medium', 60.00, 'Well-trained former service dog looking for an active family.', true, 'Tampere', 'Finland', '33700');

-- Insert traits
INSERT INTO pet_traits (pet_id, trait) VALUES
                                           (1, 'Good with cats'),
                                           (1, 'Good with dogs'),
                                           (1, 'Good with children'),
                                           (1, 'Affectionate'),
                                           (1, 'Playful'),
                                           (1, 'Friendly with animals'),
                                           (2, 'Playful'),
                                           (2, 'Affectionate'),
                                           (2, 'Good with cats'),
                                           (3, 'Energetic'),
                                           (3, 'Intelligent'),
                                           (3, 'Good with dogs'),
                                           (4, 'Friendly'),
                                           (4, 'Playful'),
                                           (4, 'Good with children'),
                                           (5, 'Calm'),
                                           (5, 'Gentle'),
                                           (6, 'Loyal'),
                                           (6, 'Intelligent'),
                                           (6, 'Protective'),
                                           (7, 'Gentle'),
                                           (7, 'Calm'),
                                           (7, 'Good with children'),
                                           (8, 'Independent'),
                                           (8, 'Vocal'),
                                           (9, 'Playful'),
                                           (9, 'Curious'),
                                           (10, 'Adventurous'),
                                           (10, 'Energetic'),
                                           (11, 'Sociable'),
                                           (11, 'Gentle'),
                                           (12, 'Calm'),
                                           (12, 'Gentle');
