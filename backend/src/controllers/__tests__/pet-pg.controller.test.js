import { jest, describe, test, expect, beforeEach } from '@jest/globals';

// Pool-based and checkContent-dependent pet controller functions need
// jest.unstable_mockModule() because jest.mock() factory doesn't intercept
// ES module named-export live bindings with --experimental-vm-modules.

const mockPoolQuery = jest.fn();
const mockCheckContent = jest.fn();
const mockPetModelFindById = jest.fn();
const mockPetModelCreate = jest.fn();
const mockPetModelUpdate = jest.fn();

jest.unstable_mockModule('../../config/database/connectPostgresDB.js', () => ({
    pool: { query: mockPoolQuery },
    connectPostgresDB: jest.fn(),
}));

jest.unstable_mockModule('../../utils/contentFilter.js', () => ({
    checkContent: mockCheckContent,
    refreshCache: jest.fn(),
}));

jest.unstable_mockModule('../../models/pet.model.js', () => ({
    PetModel: {
        findById: mockPetModelFindById,
        findAll: jest.fn(),
        search: jest.fn(),
        findSimilar: jest.fn(),
        create: mockPetModelCreate,
        update: mockPetModelUpdate,
        getSuggestions: jest.fn(),
        adoptPet: jest.fn(),
        markAsFound: jest.fn(),
        returnPet: jest.fn(),
        unadoptPet: jest.fn(),
    },
}));

jest.unstable_mockModule('../../models/adoption.model.js', () => ({
    Adoption: { findOne: jest.fn(), find: jest.fn() },
}));

jest.unstable_mockModule('../../models/user.model.js', () => ({
    User: { findById: jest.fn(), findOne: jest.fn(), find: jest.fn(), countDocuments: jest.fn() },
}));

const { createPet, updatePet, deletePet } = await import('../pet.controller.js');

// ── helpers ──────────────────────────────────────────────────────────────────
function makePet(overrides = {}) {
    return {
        id: 1,
        name: 'Buddy',
        type: 'dog',
        description: 'A friendly dog',
        gender: 'male',
        situation: 'stray',
        current_status: 'available',
        microchip_status: 'microchipped',
        neutered_spayed_status: 'neutered',
        vaccination_status: 'vaccinated',
        location_city: 'New York',
        status: 'approved',
        adoption_status: 'available',
        uploader_id: 'user-123',
        traits: [],
        photos: [],
        ...overrides,
    };
}

const validBody = {
    name: 'Buddy',
    type: 'dog',
    description: 'A friendly dog',
    gender: 'male',
    situation: 'stray',
    current_status: 'available',
    microchip_status: 'microchipped',
    neutered_spayed_status: 'neutered',
    vaccination_status: 'vaccinated',
    location_city: 'New York',
};

// ─────────────────────────────────────────────────────────────────────────────

describe('Pet Controller — createPet / updatePet / deletePet', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();

        // Default: content always passes
        mockCheckContent.mockResolvedValue({ ok: true, found: [] });

        req = {
            params: {},
            body: {},
            query: {},
            userId: 'user-123',
            isAdmin: false,
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    // ── createPet ────────────────────────────────────────────────────────────
    describe('createPet', () => {
        test('should create pet with all fields', async () => {
            req.body = { ...validBody, breed: 'Golden Retriever' };
            const created = makePet(req.body);
            mockPetModelCreate.mockResolvedValue(created);

            await createPet(req, res);

            expect(mockCheckContent).toHaveBeenCalled();
            expect(mockPetModelCreate).toHaveBeenCalledWith(
                expect.objectContaining({ name: 'Buddy', type: 'dog', breed: 'Golden Retriever' })
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Pet created successfully',
                pet: expect.objectContaining({ name: 'Buddy' }),
            });
        });

        test('should return 400 when required field is missing', async () => {
            const { name: _omit, ...bodyWithoutName } = validBody;
            req.body = bodyWithoutName;

            await createPet(req, res);

            expect(mockPetModelCreate).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: false, message: expect.stringContaining('Missing required fields') })
            );
        });

        test('should return 400 when content contains forbidden words', async () => {
            req.body = { ...validBody };
            mockCheckContent.mockResolvedValue({ ok: false, found: ['badword'] });

            await createPet(req, res);

            expect(mockPetModelCreate).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: false, message: expect.stringContaining("isn't allowed") })
            );
        });

        test('should create pet with traits array', async () => {
            req.body = { ...validBody, traits: ['friendly', 'house-trained'] };
            const created = makePet({ traits: ['friendly', 'house-trained'] });
            mockPetModelCreate.mockResolvedValue(created);

            await createPet(req, res);

            expect(mockPetModelCreate).toHaveBeenCalledWith(
                expect.objectContaining({ traits: expect.arrayContaining(['friendly', 'house-trained']) })
            );
            expect(res.status).toHaveBeenCalledWith(201);
        });

        test('should return 500 on database failure', async () => {
            req.body = { ...validBody };
            mockPetModelCreate.mockRejectedValue(new Error('Transaction failed'));

            await createPet(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Failed to create pet',
                error: 'Transaction failed',
            });
        });
    });

    // ── updatePet ────────────────────────────────────────────────────────────
    describe('updatePet', () => {
        test('should update basic fields (admin)', async () => {
            req.params.id = '1';
            req.isAdmin = true;
            req.body = { name: 'Buddy Updated', description: 'Updated' };

            const existing = makePet({ id: '1' });
            mockPetModelFindById.mockResolvedValue(existing);
            const updated = makePet({ name: 'Buddy Updated', description: 'Updated' });
            mockPetModelUpdate.mockResolvedValue(updated);

            await updatePet(req, res);

            expect(mockCheckContent).toHaveBeenCalled();
            expect(mockPetModelUpdate).toHaveBeenCalledWith('1', expect.objectContaining({ name: 'Buddy Updated' }));
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Pet updated successfully',
                pet: expect.objectContaining({ name: 'Buddy Updated' }),
            });
        });

        test('should return 404 when pet not found', async () => {
            req.params.id = '999';
            req.isAdmin = true;
            req.body = { name: 'New Name' };
            mockPetModelFindById.mockResolvedValue(null);

            await updatePet(req, res);

            expect(mockPetModelUpdate).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Pet not found' });
        });

        test('should return 403 when user is not the uploader and not admin', async () => {
            req.params.id = '1';
            req.userId = 'stranger';
            req.isAdmin = false;
            req.body = { name: 'New Name' };

            const existing = makePet({ uploader_id: 'real-owner' });
            mockPetModelFindById.mockResolvedValue(existing);

            await updatePet(req, res);

            expect(mockPetModelUpdate).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
        });

        test('should return 400 when content contains forbidden words', async () => {
            req.params.id = '1';
            req.isAdmin = true;
            req.body = { name: 'bad name' };
            mockPetModelFindById.mockResolvedValue(makePet({ id: '1' }));
            mockCheckContent.mockResolvedValue({ ok: false, found: ['badword'] });

            await updatePet(req, res);

            expect(mockPetModelUpdate).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: false, message: expect.stringContaining("isn't allowed") })
            );
        });

        test('should allow uploader to update own pet', async () => {
            req.params.id = '1';
            req.userId = 'user-123';
            req.isAdmin = false;
            req.body = { name: 'My Updated Name' };

            const existing = makePet({ uploader_id: 'user-123' });
            mockPetModelFindById.mockResolvedValue(existing);
            mockPetModelUpdate.mockResolvedValue(makePet({ name: 'My Updated Name' }));

            await updatePet(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        test('should return 500 on database failure', async () => {
            req.params.id = '1';
            req.isAdmin = true;
            req.body = { name: 'Name' };
            mockPetModelFindById.mockResolvedValue(makePet({ id: '1' }));
            mockPetModelUpdate.mockRejectedValue(new Error('Transaction failed'));

            await updatePet(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Failed to update pet',
                error: 'Transaction failed',
            });
        });
    });

    // ── deletePet ────────────────────────────────────────────────────────────
    describe('deletePet', () => {
        test('should delete pet successfully as admin', async () => {
            req.params.id = '1';
            req.isAdmin = true;
            req.userId = 'admin-user-id';

            mockPoolQuery
                .mockResolvedValueOnce({ rows: [{ uploader_id: 'other-user' }] })
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [] });

            await deletePet(req, res);

            expect(mockPoolQuery).toHaveBeenCalledTimes(5);
            expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Pet deleted successfully' });
        });

        test('should delete pet when user is the uploader', async () => {
            req.params.id = '2';
            req.userId = 'owner-user-id';
            req.isAdmin = false;

            mockPoolQuery
                .mockResolvedValueOnce({ rows: [{ uploader_id: 'owner-user-id' }] })
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [] });

            await deletePet(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Pet deleted successfully' });
        });

        test('should return 404 if pet not found', async () => {
            req.params.id = '999';
            req.isAdmin = true;

            mockPoolQuery.mockResolvedValueOnce({ rows: [] });

            await deletePet(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Pet not found' });
        });

        test('should return 403 if user is not the uploader and not admin', async () => {
            req.params.id = '1';
            req.userId = 'stranger-user';
            req.isAdmin = false;

            mockPoolQuery.mockResolvedValueOnce({ rows: [{ uploader_id: 'real-owner' }] });

            await deletePet(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Not authorized' });
        });

        test('should return 500 on database error', async () => {
            req.params.id = '1';
            req.isAdmin = true;

            mockPoolQuery.mockRejectedValue(new Error('DB connection lost'));

            await deletePet(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Server error' });
        });
    });
});
