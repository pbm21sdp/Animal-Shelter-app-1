/**
 * Mock Pet Model for Testing
 * Provides mock PostgreSQL PetModel methods and factory functions
 */

import { jest } from '@jest/globals';

/**
 * Creates a mock pet object matching PostgreSQL schema
 * @param {Object} overrides - Properties to override in the mock pet
 * @returns {Object} Mock pet object
 */
export const createMockPet = (overrides = {}) => ({
  id: 1,
  name: 'Buddy',
  type: 'dog',
  breed: 'Golden Retriever',
  age_category: 'adult',
  gender: 'male',
  size: 'large',
  color: 'golden',
  city: 'New York',
  zip_code: '10001',
  description: 'A friendly and energetic dog looking for a loving home.',
  adoption_status: 'available',
  is_available: true,
  photos: [
    { id: 1, photo_url: 'base64photo1', is_primary: true },
    { id: 2, photo_url: 'base64photo2', is_primary: false },
  ],
  traits: ['friendly', 'house-trained', 'good-with-kids'],
  created_at: new Date('2025-01-01T12:00:00Z'),
  updated_at: new Date('2025-01-01T12:00:00Z'),
  ...overrides,
});

/**
 * Creates a mock search suggestion object
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock suggestion
 */
export const createMockSuggestion = (overrides = {}) => ({
  id: 1,
  name: 'Buddy',
  type: 'dog',
  breed: 'Golden Retriever',
  category: 'Name',
  ...overrides,
});

// PetModel mock
export const PetModel = {
  // Query methods
  findAll: jest.fn(),
  search: jest.fn(),
  findById: jest.fn(),
  findSimilar: jest.fn(),
  getSuggestions: jest.fn(),

  // Mutation methods
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  updateAdoptionStatus: jest.fn(), // Existing method

  // Helper to reset all mocks
  __resetMocks: () => {
    Object.values(PetModel).forEach(mockFn => {
      if (typeof mockFn === 'function' && mockFn.mockReset) {
        mockFn.mockReset();
      }
    });
  },
};

// Default implementations
PetModel.findAll.mockResolvedValue([createMockPet()]);

PetModel.search.mockResolvedValue({
  pets: [createMockPet()],
  totalCount: 1,
});

PetModel.findById.mockResolvedValue(createMockPet());

PetModel.findSimilar.mockResolvedValue([
  createMockPet({ id: 2, name: 'Max' }),
  createMockPet({ id: 3, name: 'Charlie' }),
  createMockPet({ id: 4, name: 'Cooper' }),
  createMockPet({ id: 5, name: 'Rocky' }),
]);

PetModel.getSuggestions.mockResolvedValue([
  createMockSuggestion({ id: 1, name: 'Buddy', category: 'Name' }),
  createMockSuggestion({ id: 2, name: 'Golden Retriever', category: 'Breed' }),
]);

PetModel.create.mockResolvedValue(createMockPet());

PetModel.update.mockResolvedValue(createMockPet());

PetModel.delete.mockResolvedValue(createMockPet());

PetModel.updateAdoptionStatus.mockResolvedValue(createMockPet());
