CREATE TABLE IF NOT EXISTS animals (

    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    breed VARCHAR(100) NOT NULL
);

INSERT INTO animals (name, breed) VALUES
        ('Buddy', 'Labrador'),
        ('Whiskers', 'Siamese')

ON CONFLICT DO NOTHING;