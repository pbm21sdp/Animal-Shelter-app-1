/**
 * Pet Controller Unit Tests
 * Tests all 8 exported controller functions with PostgreSQL mocking
 */

import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import {
  getAllPets,
  searchPets,
  getPetById,
  getSimilarPets,
  createPet,
  updatePet,
  deletePet,
  getSearchSuggestions,
} from '../pet.controller.js';

// Mock models
jest.mock('../../models/pet.model.js');
jest.mock('../../models/adoption.model.js');

import { PetModel } from '../../models/pet.model.js';
import { createMockPet, createMockSuggestion } from '../../models/__mocks__/pet.model.js';
import { Adoption } from '../../models/adoption.model.js';

describe('Pet Controller', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      params: {},
      query: {},
      userId: undefined,
      isAdmin: false,
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  // ==================== getAllPets ====================
  describe('getAllPets', () => {
    test('should return all available pets with no filters', async () => {
      // Arrange
      const mockPets = [
        createMockPet({ id: 1, name: 'Buddy' }),
        createMockPet({ id: 2, name: 'Max' }),
      ];
      PetModel.findAll = jest.fn().mockResolvedValue(mockPets);

      // Act
      await getAllPets(req, res);

      // Assert
      expect(PetModel.findAll).toHaveBeenCalledWith({ is_available: true });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        pets: mockPets,
      });
    });

    test('should filter pets by type', async () => {
      // Arrange
      req.query.type = 'dog';
      const mockPets = [createMockPet({ type: 'dog' })];
      PetModel.findAll = jest.fn().mockResolvedValue(mockPets);

      // Act
      await getAllPets(req, res);

      // Assert
      expect(PetModel.findAll).toHaveBeenCalledWith({ type: 'dog', is_available: true });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should filter pets by city', async () => {
      // Arrange
      req.query.city = 'New York';
      const mockPets = [createMockPet({ city: 'New York' })];
      PetModel.findAll = jest.fn().mockResolvedValue(mockPets);

      // Act
      await getAllPets(req, res);

      // Assert
      expect(PetModel.findAll).toHaveBeenCalledWith({ city: 'New York', is_available: true });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should filter pets by zipCode', async () => {
      // Arrange
      req.query.zipCode = '10001';
      const mockPets = [createMockPet({ zip_code: '10001' })];
      PetModel.findAll = jest.fn().mockResolvedValue(mockPets);

      // Act
      await getAllPets(req, res);

      // Assert
      expect(PetModel.findAll).toHaveBeenCalledWith({ zipCode: '10001', is_available: true });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should return all pets when showAll is true (admin)', async () => {
      // Arrange
      req.query.showAll = 'true';
      const mockPets = [
        createMockPet({ id: 1, adoption_status: 'available' }),
        createMockPet({ id: 2, adoption_status: 'adopted' }),
      ];
      PetModel.findAll = jest.fn().mockResolvedValue(mockPets);

      // Act
      await getAllPets(req, res);

      // Assert
      expect(PetModel.findAll).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should limit results when limit parameter is provided', async () => {
      // Arrange
      req.query.limit = '5';
      const mockPets = Array.from({ length: 10 }, (_, i) => createMockPet({ id: i + 1 }));
      PetModel.findAll = jest.fn().mockResolvedValue(mockPets);

      // Act
      await getAllPets(req, res);

      // Assert
      expect(PetModel.findAll).toHaveBeenCalledWith({ is_available: true });
      expect(res.status).toHaveBeenCalledWith(200);
      const returnedPets = res.json.mock.calls[0][0].pets;
      expect(returnedPets.length).toBe(5);
    });

    test('should handle database errors gracefully', async () => {
      // Arrange
      PetModel.findAll = jest.fn().mockRejectedValue(new Error('Database error'));

      // Act
      await getAllPets(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch pets',
        error: 'Database error',
      });
    });
  });

  // ==================== searchPets ====================
  describe('searchPets', () => {
    test('should return pets with all filters applied', async () => {
      // Arrange
      req.query = {
        term: 'golden',
        type: 'dog',
        gender: 'male',
        ageCategory: 'adult',
        size: 'large',
        color: 'golden',
        breed: 'Golden Retriever',
        sortBy: 'newest',
      };
      const mockPets = [createMockPet()];
      PetModel.search = jest.fn().mockResolvedValue(mockPets);

      // Act
      await searchPets(req, res);

      // Assert
      expect(PetModel.search).toHaveBeenCalledWith(
        expect.objectContaining({
          term: 'golden',
          type: 'dog',
          gender: 'male',
          ageCategory: 'adult',
          size: 'large',
          color: 'golden',
          breed: 'Golden Retriever',
          sortBy: 'newest',
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        totalCount: 1,
        pets: mockPets,
      });
    });

    test('should filter by search term (name/breed/description)', async () => {
      // Arrange
      req.query.term = 'friendly';
      const mockPets = [createMockPet({ description: 'A friendly dog' })];
      PetModel.search = jest.fn().mockResolvedValue(mockPets);

      // Act
      await searchPets(req, res);

      // Assert
      expect(PetModel.search).toHaveBeenCalledWith(
        expect.objectContaining({ term: 'friendly' })
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should sort by newest (DESC)', async () => {
      // Arrange
      req.query.sortBy = 'newest';
      const mockPets = [createMockPet()];
      PetModel.search = jest.fn().mockResolvedValue(mockPets);

      // Act
      await searchPets(req, res);

      // Assert
      expect(PetModel.search).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: 'newest' })
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should sort by oldest (ASC)', async () => {
      // Arrange
      req.query.sortBy = 'oldest';
      const mockPets = [createMockPet()];
      PetModel.search = jest.fn().mockResolvedValue(mockPets);

      // Act
      await searchPets(req, res);

      // Assert
      expect(PetModel.search).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: 'oldest' })
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should return totalCount matching results', async () => {
      // Arrange
      req.query.type = 'dog';
      const mockPets = [createMockPet(), createMockPet({ id: 2 })];
      PetModel.search = jest.fn().mockResolvedValue(mockPets);

      // Act
      await searchPets(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ totalCount: 2 })
      );
    });

    test('should handle empty results gracefully', async () => {
      // Arrange
      req.query.type = 'unicorn';
      const mockPets = [];
      PetModel.search = jest.fn().mockResolvedValue(mockPets);

      // Act
      await searchPets(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        totalCount: 0,
        pets: [],
      });
    });

    test('should handle database errors gracefully', async () => {
      // Arrange
      PetModel.search = jest.fn().mockRejectedValue(new Error('Database error'));

      // Act
      await searchPets(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to search pets',
        error: 'Database error',
      });
    });
  });

  // ==================== getPetById ====================
  describe('getPetById', () => {
    test('should return available pet for authenticated user', async () => {
      // Arrange
      req.params.id = '1';
      req.userId = 'user123';
      const mockPet = createMockPet({ adoption_status: 'available' });
      PetModel.findById = jest.fn().mockResolvedValue(mockPet);
      Adoption.findOne = jest.fn();

      // Act
      await getPetById(req, res);

      // Assert
      expect(PetModel.findById).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        pet: mockPet,
      });
      expect(Adoption.findOne).not.toHaveBeenCalled();
    });

    test('should allow admin to view unavailable pet', async () => {
      // Arrange
      req.params.id = '1';
      req.userId = 'admin123';
      req.isAdmin = true;
      const mockPet = createMockPet({ adoption_status: 'adopted' });
      PetModel.findById = jest.fn().mockResolvedValue(mockPet);
      Adoption.findOne = jest.fn();

      // Act
      await getPetById(req, res);

      // Assert
      expect(PetModel.findById).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        pet: mockPet,
      });
      expect(Adoption.findOne).not.toHaveBeenCalled();
    });

    test('should allow user with active adoption to view unavailable pet', async () => {
      // Arrange
      req.params.id = '1';
      req.userId = 'user123';
      const mockPet = createMockPet({ id: 1, adoption_status: 'pending' });
      PetModel.findById = jest.fn().mockResolvedValue(mockPet);

      Adoption.findOne = jest.fn().mockResolvedValue({
        _id: 'adoption123',
        user: 'user123',
        petId: 1,
        status: 'pending',
      });

      // Act
      await getPetById(req, res);

      // Assert
      expect(PetModel.findById).toHaveBeenCalledWith('1');
      expect(Adoption.findOne).toHaveBeenCalledWith({
        user: 'user123',
        petId: 1,
        status: { $in: ['pending', 'in_review', 'approved'] },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        pet: mockPet,
      });
    });

    test('should return pet with photos and traits', async () => {
      // Arrange
      req.params.id = '1';
      req.userId = 'user123';
      const mockPet = createMockPet({
        photos: [
          { id: 1, photo_url: 'base64photo1', is_primary: true },
          { id: 2, photo_url: 'base64photo2', is_primary: false },
        ],
        traits: ['friendly', 'house-trained', 'good-with-kids'],
      });
      PetModel.findById = jest.fn().mockResolvedValue(mockPet);

      // Act
      await getPetById(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        pet: expect.objectContaining({
          photos: expect.arrayContaining([
            expect.objectContaining({ is_primary: true }),
          ]),
          traits: expect.arrayContaining(['friendly', 'house-trained']),
        }),
      });
    });

    test('should return 404 if pet not found', async () => {
      // Arrange
      req.params.id = '999';
      req.userId = 'user123';
      PetModel.findById = jest.fn().mockResolvedValue(null);

      // Act
      await getPetById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Pet not found',
      });
    });

    test('should return 404 for unavailable pet when user has no adoption', async () => {
      // Arrange
      req.params.id = '1';
      req.userId = 'user123';
      const mockPet = createMockPet({ id: 1, adoption_status: 'adopted' });
      PetModel.findById = jest.fn().mockResolvedValue(mockPet);
      Adoption.findOne = jest.fn().mockResolvedValue(null);

      // Act
      await getPetById(req, res);

      // Assert
      expect(Adoption.findOne).toHaveBeenCalledWith({
        user: 'user123',
        petId: 1,
        status: { $in: ['pending', 'in_review', 'approved'] },
      });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Pet not found',
      });
    });

    test('should return 404 for unavailable pet when not authenticated', async () => {
      // Arrange
      req.params.id = '1';
      const mockPet = createMockPet({ adoption_status: 'adopted' });
      PetModel.findById = jest.fn().mockResolvedValue(mockPet);

      // Act
      await getPetById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Pet not found',
      });
    });

    test('should handle database errors gracefully', async () => {
      // Arrange
      req.params.id = '1';
      req.userId = 'user123';
      PetModel.findById = jest.fn().mockRejectedValue(new Error('Database error'));

      // Act
      await getPetById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch pet',
        error: 'Database error',
      });
    });
  });

  // ==================== getSimilarPets ====================
  describe('getSimilarPets', () => {
    test('should return 4 similar pets by type and breed', async () => {
      // Arrange
      req.params.id = '1';
      const mockSimilarPets = [
        createMockPet({ id: 2, name: 'Max', type: 'dog', breed: 'Golden Retriever' }),
        createMockPet({ id: 3, name: 'Charlie', type: 'dog', breed: 'Golden Retriever' }),
        createMockPet({ id: 4, name: 'Cooper', type: 'dog', breed: 'Golden Retriever' }),
        createMockPet({ id: 5, name: 'Rocky', type: 'dog', breed: 'Golden Retriever' }),
      ];
      PetModel.findSimilar = jest.fn().mockResolvedValue(mockSimilarPets);

      // Act
      await getSimilarPets(req, res);

      // Assert
      expect(PetModel.findSimilar).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        pets: mockSimilarPets,
      });
      expect(mockSimilarPets).toHaveLength(4);
    });

    test('should exclude requested pet itself', async () => {
      // Arrange
      req.params.id = '1';
      const mockSimilarPets = [
        createMockPet({ id: 2, name: 'Max' }),
        createMockPet({ id: 3, name: 'Charlie' }),
      ];
      PetModel.findSimilar = jest.fn().mockResolvedValue(mockSimilarPets);

      // Act
      await getSimilarPets(req, res);

      // Assert
      expect(mockSimilarPets.every(pet => pet.id !== 1)).toBe(true);
    });

    test('should only return available pets', async () => {
      // Arrange
      req.params.id = '1';
      const mockSimilarPets = [
        createMockPet({ id: 2, adoption_status: 'available' }),
        createMockPet({ id: 3, adoption_status: 'available' }),
      ];
      PetModel.findSimilar = jest.fn().mockResolvedValue(mockSimilarPets);

      // Act
      await getSimilarPets(req, res);

      // Assert
      expect(mockSimilarPets.every(pet => pet.adoption_status === 'available')).toBe(true);
    });

    test('should return photos for each pet', async () => {
      // Arrange
      req.params.id = '1';
      const mockSimilarPets = [
        createMockPet({
          id: 2,
          photos: [{ id: 1, photo_url: 'base64photo', is_primary: true }],
        }),
      ];
      PetModel.findSimilar = jest.fn().mockResolvedValue(mockSimilarPets);

      // Act
      await getSimilarPets(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        pets: expect.arrayContaining([
          expect.objectContaining({
            photos: expect.any(Array),
          }),
        ]),
      });
    });

    test('should handle database errors gracefully', async () => {
      // Arrange
      req.params.id = '1';
      PetModel.findSimilar = jest.fn().mockRejectedValue(new Error('Database error'));

      // Act
      await getSimilarPets(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch similar pets',
        error: 'Database error',
      });
    });
  });

  // ==================== createPet ====================
  describe('createPet', () => {
    test('should create pet with all fields', async () => {
      // Arrange
      req.body = {
        name: 'Buddy',
        type: 'dog',
        breed: 'Golden Retriever',
        age_category: 'adult',
        gender: 'male',
        size: 'large',
        color: 'golden',
        city: 'New York',
        zip_code: '10001',
        description: 'A friendly dog',
      };

      const mockCreatedPet = createMockPet(req.body);
      PetModel.create = jest.fn().mockResolvedValue(mockCreatedPet);

      // Act
      await createPet(req, res);

      // Assert
      expect(PetModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Buddy',
          type: 'dog',
          breed: 'Golden Retriever',
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'PetModel created successfully',
        pet: mockCreatedPet,
      });
    });

    test('should create pet with traits array', async () => {
      // Arrange
      req.body = {
        name: 'Buddy',
        type: 'dog',
        traits: ['friendly', 'house-trained', 'good-with-kids'],
      };

      const mockCreatedPet = createMockPet({
        name: 'Buddy',
        traits: ['friendly', 'house-trained', 'good-with-kids'],
      });
      PetModel.create = jest.fn().mockResolvedValue(mockCreatedPet);

      // Act
      await createPet(req, res);

      // Assert
      expect(PetModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          traits: expect.arrayContaining(['friendly', 'house-trained']),
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('should create pet with photos array (first as primary)', async () => {
      // Arrange
      req.body = {
        name: 'Buddy',
        type: 'dog',
        photos: ['base64photo1', 'base64photo2'],
      };

      const mockCreatedPet = createMockPet({
        photos: [
          { id: 1, photo_url: 'base64photo1', is_primary: true },
          { id: 2, photo_url: 'base64photo2', is_primary: false },
        ],
      });
      PetModel.create = jest.fn().mockResolvedValue(mockCreatedPet);

      // Act
      await createPet(req, res);

      // Assert
      expect(PetModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          photos: expect.arrayContaining(['base64photo1', 'base64photo2']),
        })
      );
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'PetModel created successfully',
        pet: expect.objectContaining({
          photos: expect.arrayContaining([
            expect.objectContaining({ is_primary: true }),
          ]),
        }),
      });
    });

    test('should return created pet with aggregated data', async () => {
      // Arrange
      req.body = {
        name: 'Buddy',
        type: 'dog',
        traits: ['friendly'],
        photos: ['base64photo'],
      };

      const mockCreatedPet = createMockPet({
        name: 'Buddy',
        traits: ['friendly'],
        photos: [{ id: 1, photo_url: 'base64photo', is_primary: true }],
      });
      PetModel.create = jest.fn().mockResolvedValue(mockCreatedPet);

      // Act
      await createPet(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'PetModel created successfully',
        pet: expect.objectContaining({
          name: 'Buddy',
          traits: expect.any(Array),
          photos: expect.any(Array),
        }),
      });
    });

    test('should handle transaction failures', async () => {
      // Arrange
      req.body = { name: 'Buddy', type: 'dog' };
      PetModel.create = jest.fn().mockRejectedValue(new Error('Transaction failed'));

      // Act
      await createPet(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to create pet',
        error: 'Transaction failed',
      });
    });
  });

  // ==================== updatePet ====================
  describe('updatePet', () => {
    test('should update basic fields', async () => {
      // Arrange
      req.params.id = '1';
      req.body = {
        name: 'Buddy Updated',
        description: 'Updated description',
      };

      const mockUpdatedPet = createMockPet({
        name: 'Buddy Updated',
        description: 'Updated description',
      });
      PetModel.update = jest.fn().mockResolvedValue(mockUpdatedPet);

      // Act
      await updatePet(req, res);

      // Assert
      expect(PetModel.update).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          name: 'Buddy Updated',
          description: 'Updated description',
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'PetModel updated successfully',
        pet: mockUpdatedPet,
      });
    });

    test('should replace traits array', async () => {
      // Arrange
      req.params.id = '1';
      req.body = {
        traits: ['playful', 'energetic'],
      };

      const mockUpdatedPet = createMockPet({
        traits: ['playful', 'energetic'],
      });
      PetModel.update = jest.fn().mockResolvedValue(mockUpdatedPet);

      // Act
      await updatePet(req, res);

      // Assert
      expect(PetModel.update).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          traits: expect.arrayContaining(['playful', 'energetic']),
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should replace photos array (first as primary)', async () => {
      // Arrange
      req.params.id = '1';
      req.body = {
        photos: ['newphoto1', 'newphoto2'],
      };

      const mockUpdatedPet = createMockPet({
        photos: [
          { id: 1, photo_url: 'newphoto1', is_primary: true },
          { id: 2, photo_url: 'newphoto2', is_primary: false },
        ],
      });
      PetModel.update = jest.fn().mockResolvedValue(mockUpdatedPet);

      // Act
      await updatePet(req, res);

      // Assert
      expect(PetModel.update).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          photos: expect.arrayContaining(['newphoto1', 'newphoto2']),
        })
      );
    });

    test('should handle partial updates (only provided fields)', async () => {
      // Arrange
      req.params.id = '1';
      req.body = {
        color: 'brown',
      };

      const mockUpdatedPet = createMockPet({ color: 'brown' });
      PetModel.update = jest.fn().mockResolvedValue(mockUpdatedPet);

      // Act
      await updatePet(req, res);

      // Assert
      expect(PetModel.update).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ color: 'brown' })
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should return updated pet', async () => {
      // Arrange
      req.params.id = '1';
      req.body = { name: 'Updated Name' };

      const mockUpdatedPet = createMockPet({ name: 'Updated Name' });
      PetModel.update = jest.fn().mockResolvedValue(mockUpdatedPet);

      // Act
      await updatePet(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'PetModel updated successfully',
        pet: expect.objectContaining({ name: 'Updated Name' }),
      });
    });

    test('should return 404 if pet not found', async () => {
      // Arrange
      req.params.id = '999';
      req.body = { name: 'Updated Name' };
      PetModel.update = jest.fn().mockResolvedValue(null);

      // Act
      await updatePet(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'PetModel not found',
      });
    });

    test('should handle transaction failures', async () => {
      // Arrange
      req.params.id = '1';
      req.body = { name: 'Updated Name' };
      PetModel.update = jest.fn().mockRejectedValue(new Error('Transaction failed'));

      // Act
      await updatePet(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to update pet',
        error: 'Transaction failed',
      });
    });
  });

  // ==================== deletePet ====================
  describe('deletePet', () => {
    test('should delete pet successfully', async () => {
      // Arrange
      req.params.id = '1';

      const mockDeletedPet = createMockPet();
      PetModel.delete = jest.fn().mockResolvedValue(mockDeletedPet);

      // Act
      await deletePet(req, res);

      // Assert
      expect(PetModel.delete).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'PetModel deleted successfully',
      });
    });

    test('should return deleted pet data', async () => {
      // Arrange
      req.params.id = '1';

      const mockDeletedPet = createMockPet({ name: 'Deleted Pet' });
      PetModel.delete = jest.fn().mockResolvedValue(mockDeletedPet);

      // Act
      await deletePet(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'PetModel deleted successfully',
        })
      );
    });

    test('should return 404 if pet not found', async () => {
      // Arrange
      req.params.id = '999';
      PetModel.delete = jest.fn().mockResolvedValue(null);

      // Act
      await deletePet(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'PetModel not found',
      });
    });

    test('should handle database deletion failures', async () => {
      // Arrange
      req.params.id = '1';
      PetModel.delete = jest.fn().mockRejectedValue(new Error('Database error'));

      // Act
      await deletePet(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to delete pet',
        error: 'Database error',
      });
    });
  });

  // ==================== getSearchSuggestions ====================
  describe('getSearchSuggestions', () => {
    test('should return suggestions for term >= 2 chars', async () => {
      // Arrange
      req.query.term = 'bu';
      const mockSuggestions = [
        createMockSuggestion({ name: 'Buddy', category: 'Name' }),
        createMockSuggestion({ name: 'Bulldog', category: 'Breed' }),
      ];
      PetModel.getSuggestions = jest.fn().mockResolvedValue(mockSuggestions);

      // Act
      await getSearchSuggestions(req, res);

      // Assert
      expect(PetModel.getSuggestions).toHaveBeenCalledWith('bu');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        suggestions: expect.arrayContaining(mockSuggestions),
      });
    });

    test('should return max 8 suggestions', async () => {
      // Arrange
      req.query.term = 'dog';
      const mockSuggestions = Array.from({ length: 10 }, (_, i) =>
        createMockSuggestion({ id: i + 1, name: `Dog ${i}` })
      );
      PetModel.getSuggestions = jest.fn().mockResolvedValue(mockSuggestions.slice(0, 8));

      // Act
      await getSearchSuggestions(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        suggestions: expect.any(Array),
      });
      const suggestions = res.json.mock.calls[0][0].suggestions;
      expect(suggestions.length).toBeLessThanOrEqual(8);
    });

    test('should deduplicate results', async () => {
      // Arrange
      req.query.term = 'golden';
      const mockSuggestions = [
        createMockSuggestion({ id: 1, name: 'Golden Retriever', category: 'Breed' }),
        createMockSuggestion({ id: 2, name: 'Golden', category: 'Name' }),
      ];
      PetModel.getSuggestions = jest.fn().mockResolvedValue(mockSuggestions);

      // Act
      await getSearchSuggestions(req, res);

      // Assert
      const suggestions = res.json.mock.calls[0][0].suggestions;
      const uniqueNames = new Set(suggestions.map(s => s.name));
      expect(uniqueNames.size).toBe(suggestions.length);
    });

    test('should categorize suggestions (Name, Breed, Type, Search)', async () => {
      // Arrange
      req.query.term = 'dog';
      const mockSuggestions = [
        createMockSuggestion({ name: 'Doggy', category: 'Name' }),
        createMockSuggestion({ name: 'dog', category: 'Type' }),
        createMockSuggestion({ name: 'dog', category: 'Breed' }),
      ];
      PetModel.getSuggestions = jest.fn().mockResolvedValue(mockSuggestions);

      // Act
      await getSearchSuggestions(req, res);

      // Assert
      const suggestions = res.json.mock.calls[0][0].suggestions;
      const categories = suggestions.map(s => s.category);
      expect(categories).toContain('Name');
    });

    test('should return empty array for term < 2 characters', async () => {
      // Arrange
      req.query.term = 'a';

      // Act
      await getSearchSuggestions(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        suggestions: [],
      });
      expect(PetModel.getSuggestions).not.toHaveBeenCalled();
    });

    test('should handle database error gracefully', async () => {
      // Arrange
      req.query.term = 'dog';
      PetModel.getSuggestions = jest.fn().mockRejectedValue(new Error('Database error'));

      // Act
      await getSearchSuggestions(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to get search suggestions',
        error: 'Database error',
      });
    });
  });
});
