/**
 * Test Data Fixtures
 * Provides sample data for testing
 */

import bcrypt from 'bcryptjs';
import { query } from './dbSetup.js';

/**
 * Sample user data
 */
export const testUsers = {
  regularUser: {
    email: 'testuser@example.com',
    password: 'Test123!@#',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
    isVerified: true,
  },
  adminUser: {
    email: 'admin@example.com',
    password: 'Admin123!@#',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    isVerified: true,
  },
  unverifiedUser: {
    email: 'unverified@example.com',
    password: 'Unverified123!@#',
    firstName: 'Unverified',
    lastName: 'User',
    role: 'user',
    isVerified: false,
  },
};

/**
 * Sample pet data
 */
export const testPets = [
  {
    name: 'Buddy',
    species: 'dog',
    breed: 'Golden Retriever',
    age: 3,
    gender: 'male',
    size: 'large',
    color: 'golden',
    description: 'Friendly and energetic dog',
    health_status: 'healthy',
    vaccination_status: 'up_to_date',
    spayed_neutered: true,
    house_trained: true,
    good_with_kids: true,
    good_with_pets: true,
    energy_level: 'high',
    special_needs: null,
    availability_status: 'available',
  },
  {
    name: 'Whiskers',
    species: 'cat',
    breed: 'Persian',
    age: 2,
    gender: 'female',
    size: 'small',
    color: 'white',
    description: 'Calm and affectionate cat',
    health_status: 'healthy',
    vaccination_status: 'up_to_date',
    spayed_neutered: true,
    house_trained: true,
    good_with_kids: true,
    good_with_pets: false,
    energy_level: 'low',
    special_needs: null,
    availability_status: 'available',
  },
  {
    name: 'Max',
    species: 'dog',
    breed: 'German Shepherd',
    age: 5,
    gender: 'male',
    size: 'large',
    color: 'black and tan',
    description: 'Loyal and protective dog',
    health_status: 'healthy',
    vaccination_status: 'up_to_date',
    spayed_neutered: true,
    house_trained: true,
    good_with_kids: false,
    good_with_pets: true,
    energy_level: 'medium',
    special_needs: 'Needs experienced owner',
    availability_status: 'pending',
  },
];

/**
 * Sample adoption application data
 */
export const testAdoptions = [
  {
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '555-0100',
    address: '123 Main St',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62701',
    housingType: 'house',
    ownRent: 'own',
    landlordAllowsPets: true,
    hasYard: true,
    yardFenced: true,
    hasChildren: true,
    childrenAges: '5, 8',
    hasPets: false,
    petDetails: null,
    experience: 'I have owned dogs for 10 years',
    whyAdopt: 'Looking for a family companion',
    status: 'pending',
  },
];

/**
 * Sample donation data
 */
export const testDonations = [
  {
    amount: 50.00,
    currency: 'usd',
    paymentStatus: 'succeeded',
    paymentMethod: 'card',
    isAnonymous: false,
    donorName: 'Jane Smith',
    donorEmail: 'jane.smith@example.com',
  },
  {
    amount: 100.00,
    currency: 'usd',
    paymentStatus: 'succeeded',
    paymentMethod: 'card',
    isAnonymous: true,
    donorName: 'Anonymous',
    donorEmail: null,
  },
];

/**
 * Seed PostgreSQL database with test pets
 */
export const seedPets = async () => {
  const insertedPets = [];

  for (const pet of testPets) {
    const result = await query(
      `INSERT INTO pets (
        name, species, breed, age, gender, size, color, description,
        health_status, vaccination_status, spayed_neutered, house_trained,
        good_with_kids, good_with_pets, energy_level, special_needs, availability_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        pet.name, pet.species, pet.breed, pet.age, pet.gender, pet.size,
        pet.color, pet.description, pet.health_status, pet.vaccination_status,
        pet.spayed_neutered, pet.house_trained, pet.good_with_kids,
        pet.good_with_pets, pet.energy_level, pet.special_needs, pet.availability_status
      ]
    );
    insertedPets.push(result.rows[0]);
  }

  console.log(`Seeded ${insertedPets.length} pets`);
  return insertedPets;
};

/**
 * Create a test user in MongoDB
 * Returns the created user with hashed password
 */
export const createTestUser = async (User, userData = testUsers.regularUser) => {
  const hashedPassword = await bcrypt.hash(userData.password, 10);

  const user = await User.create({
    ...userData,
    password: hashedPassword,
  });

  return user;
};

/**
 * Hash a password for testing
 */
export const hashPassword = async (password) => {
  return bcrypt.hash(password, 10);
};
