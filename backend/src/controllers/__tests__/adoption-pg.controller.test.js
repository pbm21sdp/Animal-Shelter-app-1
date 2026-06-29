/**
 * Tests for getAllAdoptions — queries PostgreSQL pets table (is_adopted=true).
 * Uses jest.unstable_mockModule() for proper ES module mocking with --experimental-vm-modules.
 */

import { jest, describe, test, expect, beforeEach } from '@jest/globals';

// Shared mock functions (must be defined before unstable_mockModule calls)
const mockPoolQuery = jest.fn();
const mockUserFind = jest.fn();

// Register mocks BEFORE dynamic imports
jest.unstable_mockModule('../../config/database/connectPostgresDB.js', () => ({
    pool: { query: mockPoolQuery },
    connectPostgresDB: jest.fn(),
}));

jest.unstable_mockModule('../../models/user.model.js', () => ({
    User: {
        find: mockUserFind,
        findById: jest.fn(),
        findOne: jest.fn(),
        findByIdAndDelete: jest.fn(),
    },
}));

jest.unstable_mockModule('../../models/adoption.model.js', () => ({
    Adoption: {
        find: jest.fn(),
        findOne: jest.fn(),
        findById: jest.fn(),
        findByIdAndDelete: jest.fn(),
    },
}));

jest.unstable_mockModule('../../models/pet.model.js', () => ({
    PetModel: {
        findAll: jest.fn(),
        search: jest.fn(),
        findById: jest.fn(),
        findSimilar: jest.fn(),
        getSuggestions: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        updateAdoptionStatus: jest.fn(),
        adoptPet: jest.fn(),
    },
}));

// Dynamic import of controller (uses mocked modules above)
const { getAllAdoptions } = await import('../adoption.controller.js');

describe('getAllAdoptions (PostgreSQL)', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            body: {},
            params: {},
            query: {},
            userId: '507f1f77bcf86cd799439011',
            isAdmin: true,
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    test('should return empty adoptions when no adopted pets found', async () => {
        mockPoolQuery.mockResolvedValue({ rows: [] });

        await getAllAdoptions(req, res);

        expect(mockPoolQuery).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ success: true, adoptions: [] });
    });

    test('should return enriched adoptions with uploader and adopter names', async () => {
        const mockPets = [{
            id: 1,
            petName: 'Buddy',
            petType: 'dog',
            petBreed: 'Golden Retriever',
            city: 'New York',
            adoptedAt: new Date('2025-01-15'),
            postedAt: new Date('2025-01-01'),
            daysToAdoption: 14,
            uploaderId: 'uploader-id-123',
            adoptedById: 'adopter-id-456',
            adopterExternalName: null,
            adoptionStatusLabel: 'adopted',
        }];

        const mockUsers = [
            { _id: { toString: () => 'uploader-id-123' }, name: 'John Doe', email: 'john@example.com' },
            { _id: { toString: () => 'adopter-id-456' }, name: 'Jane Smith', email: 'jane@example.com' },
        ];

        mockPoolQuery.mockResolvedValue({ rows: mockPets });
        mockUserFind.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockUsers) });

        await getAllAdoptions(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const response = res.json.mock.calls[0][0];
        expect(response.success).toBe(true);
        expect(response.adoptions).toHaveLength(1);
        expect(response.adoptions[0]).toMatchObject({
            _id: 1,
            petName: 'Buddy',
            petType: 'dog',
            uploaderName: 'John Doe',
            adopterName: 'Jane Smith',
        });
    });

    test('should handle adopterExternalName when no adoptedById', async () => {
        const mockPets = [{
            id: 2,
            petName: 'Whiskers',
            petType: 'cat',
            petBreed: null,
            city: 'Boston',
            adoptedAt: new Date('2025-02-01'),
            postedAt: new Date('2025-01-15'),
            daysToAdoption: 17,
            uploaderId: 'uploader-id-123',
            adoptedById: null,
            adopterExternalName: 'External Adopter',
            adoptionStatusLabel: 'rehomed',
        }];

        const mockUsers = [
            { _id: { toString: () => 'uploader-id-123' }, name: 'John Doe', email: 'john@example.com' },
        ];

        mockPoolQuery.mockResolvedValue({ rows: mockPets });
        mockUserFind.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockUsers) });

        await getAllAdoptions(req, res);

        const response = res.json.mock.calls[0][0];
        expect(response.adoptions[0].adopterExternalName).toBe('External Adopter');
        expect(response.adoptions[0].adopterName).toBeNull();
    });

    test('should include petType filter in SQL query when specified', async () => {
        req.query = { petType: 'cat' };
        mockPoolQuery.mockResolvedValue({ rows: [] });

        await getAllAdoptions(req, res);

        const sqlQuery = mockPoolQuery.mock.calls[0][0];
        const sqlParams = mockPoolQuery.mock.calls[0][1];
        expect(sqlQuery).toContain('LOWER(p.type)');
        expect(sqlParams).toContain('cat');
    });

    test('should filter "other" pet type using LOWER(p.type) = $n', async () => {
        req.query = { petType: 'other' };
        mockPoolQuery.mockResolvedValue({ rows: [] });

        await getAllAdoptions(req, res);

        const sqlQuery = mockPoolQuery.mock.calls[0][0];
        const sqlParams = mockPoolQuery.mock.calls[0][1];
        expect(sqlQuery).toContain('LOWER(p.type)');
        expect(sqlParams).toContain('other');
    });

    test('should use ASC sort order when sort=oldest', async () => {
        req.query = { sort: 'oldest' };
        mockPoolQuery.mockResolvedValue({ rows: [] });

        await getAllAdoptions(req, res);

        const sqlQuery = mockPoolQuery.mock.calls[0][0];
        expect(sqlQuery).toContain('ASC');
    });

    test('should use DESC sort order by default (sort=newest)', async () => {
        req.query = {};
        mockPoolQuery.mockResolvedValue({ rows: [] });

        await getAllAdoptions(req, res);

        const sqlQuery = mockPoolQuery.mock.calls[0][0];
        expect(sqlQuery).toContain('DESC');
    });

    test('should handle pool.query errors gracefully', async () => {
        mockPoolQuery.mockRejectedValue(new Error('DB connection lost'));

        await getAllAdoptions(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                message: 'Failed to fetch adoptions',
            })
        );
    });
});
