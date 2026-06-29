import { jest, describe, test, expect, beforeEach } from '@jest/globals';

const mockPoolQuery = jest.fn();
const mockUserFindById = jest.fn();
const mockUserFind = jest.fn();
const mockUserFindOne = jest.fn();
const mockUserFindByIdAndDelete = jest.fn();
const mockUserFindByIdAndUpdate = jest.fn();

jest.unstable_mockModule('../../config/database/connectPostgresDB.js', () => ({
    pool: { query: mockPoolQuery },
    connectPostgresDB: jest.fn(),
}));

jest.unstable_mockModule('../../models/user.model.js', () => ({
    User: {
        findById: mockUserFindById,
        find: mockUserFind,
        findOne: mockUserFindOne,
        findByIdAndDelete: mockUserFindByIdAndDelete,
        findByIdAndUpdate: mockUserFindByIdAndUpdate,
    },
}));

// multer, path, fs are not mocked — they initialise safely at import time
const {
    getUserProfile,
    getAllUsers,
    getUserById,
    updateUserAdminStatus,
    deleteUser,
    getPublicUserProfile,
    updateMe,
} = await import('../user.controller.js');

// Helper for building a mock Mongoose user instance
function createMockUser(overrides = {}) {
    const base = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test User',
        email: 'test@example.com',
        isAdmin: false,
        privacySettings: {},
        bio: null,
        city: null,
        contactAvailability: null,
        avatar: null,
        ...overrides,
    };
    base._doc = { ...base };
    base.save = jest.fn().mockResolvedValue(base);
    return base;
}

describe('User Controller', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            body: {},
            params: {},
            query: {},
            userId: '507f1f77bcf86cd799439011',
            isAdmin: false,
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    // ──────────────────────────────────────────────────────────────────────────
    describe('getUserProfile', () => {
        test('should return current user without sensitive fields', async () => {
            const mockUser = createMockUser();
            mockUserFindById.mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser),
            });

            await getUserProfile(req, res);

            expect(mockUserFindById).toHaveBeenCalledWith(req.userId);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ success: true, user: mockUser });
        });

        test('should return 404 when user not found', async () => {
            mockUserFindById.mockReturnValue({
                select: jest.fn().mockResolvedValue(null),
            });

            await getUserProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'User not found',
            });
        });

        test('should return 500 on database error', async () => {
            mockUserFindById.mockReturnValue({
                select: jest.fn().mockRejectedValue(new Error('DB error')),
            });

            await getUserProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Server error' });
        });
    });

    // ──────────────────────────────────────────────────────────────────────────
    describe('getAllUsers', () => {
        test('should return all users sorted by createdAt descending', async () => {
            const mockUsers = [createMockUser({ name: 'User A' }), createMockUser({ name: 'User B' })];
            mockUserFind.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    sort: jest.fn().mockResolvedValue(mockUsers),
                }),
            });

            await getAllUsers(req, res);

            expect(mockUserFind).toHaveBeenCalledWith();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ success: true, users: mockUsers });
        });

        test('should return 500 on database error', async () => {
            mockUserFind.mockReturnValue({
                select: jest.fn().mockReturnValue({
                    sort: jest.fn().mockRejectedValue(new Error('DB error')),
                }),
            });

            await getAllUsers(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Error fetching users',
            });
        });
    });

    // ──────────────────────────────────────────────────────────────────────────
    describe('getUserById', () => {
        test('should return 400 for invalid MongoDB ObjectId format', async () => {
            req.params = { userId: 'not-an-objectid' };

            await getUserById(req, res);

            expect(mockUserFindById).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid user ID format',
            });
        });

        test('should return user when found', async () => {
            req.params = { userId: '507f1f77bcf86cd799439011' };
            const mockUser = createMockUser();
            mockUserFindById.mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser),
            });

            await getUserById(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ success: true, user: mockUser });
        });

        test('should return 404 when user not found', async () => {
            req.params = { userId: '507f1f77bcf86cd799439011' };
            mockUserFindById.mockReturnValue({
                select: jest.fn().mockResolvedValue(null),
            });

            await getUserById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'User not found',
            });
        });
    });

    // ──────────────────────────────────────────────────────────────────────────
    describe('updateUserAdminStatus', () => {
        test('should return 400 when isAdmin field is missing', async () => {
            req.params = { userId: '507f1f77bcf86cd799439011' };
            req.body = {};

            await updateUserAdminStatus(req, res);

            expect(mockUserFindById).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'isAdmin field is required',
            });
        });

        test('should return 400 for invalid MongoDB ObjectId format', async () => {
            req.params = { userId: 'invalid-id' };
            req.body = { isAdmin: true };

            await updateUserAdminStatus(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid user ID format',
            });
        });

        test('should return 400 when admin tries to remove their own admin status', async () => {
            req.params = { userId: '507f1f77bcf86cd799439011' };
            req.userId = '507f1f77bcf86cd799439011'; // same as target
            req.body = { isAdmin: false };

            const mockUser = createMockUser({ isAdmin: true });
            mockUserFindById.mockResolvedValue(mockUser);

            await updateUserAdminStatus(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'You cannot remove your own admin status',
            });
        });

        test('should return 404 when user not found', async () => {
            req.params = { userId: '507f1f77bcf86cd799439011' };
            req.body = { isAdmin: true };
            mockUserFindById.mockResolvedValue(null);

            await updateUserAdminStatus(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'User not found',
            });
        });

        test('should update isAdmin and return updated user', async () => {
            req.params = { userId: '507f1f77bcf86cd799439012' };
            req.userId  = '507f1f77bcf86cd799439011'; // different from target
            req.body = { isAdmin: true };

            const mockUser = createMockUser({ _id: '507f1f77bcf86cd799439012', isAdmin: false });
            mockUserFindById.mockResolvedValue(mockUser);

            await updateUserAdminStatus(req, res);

            expect(mockUser.isAdmin).toBe(true);
            expect(mockUser.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'User admin status updated to true',
                })
            );
        });

        test('should exclude password from response', async () => {
            req.params = { userId: '507f1f77bcf86cd799439012' };
            req.userId  = '507f1f77bcf86cd799439011';
            req.body = { isAdmin: false };

            const mockUser = createMockUser({
                _id: '507f1f77bcf86cd799439012',
                isAdmin: true,
            });
            mockUser._doc.password = 'should-be-removed';
            mockUserFindById.mockResolvedValue(mockUser);

            await updateUserAdminStatus(req, res);

            const json = res.json.mock.calls[0][0];
            expect(json.user.password).toBeUndefined();
        });
    });

    // ──────────────────────────────────────────────────────────────────────────
    describe('deleteUser', () => {
        test('should return 400 for invalid MongoDB ObjectId format', async () => {
            req.params = { userId: 'bad-id' };

            await deleteUser(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Invalid user ID format',
            });
        });

        test('should return 400 when admin tries to delete their own account', async () => {
            req.params = { userId: '507f1f77bcf86cd799439011' };
            req.userId = '507f1f77bcf86cd799439011';

            await deleteUser(req, res);

            expect(mockUserFindById).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'You cannot delete your own account',
            });
        });

        test('should return 404 when user not found', async () => {
            req.params = { userId: '507f1f77bcf86cd799439012' };
            req.userId  = '507f1f77bcf86cd799439011';
            mockUserFindById.mockResolvedValue(null);

            await deleteUser(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'User not found',
            });
        });

        test('should delete user and return success message', async () => {
            req.params = { userId: '507f1f77bcf86cd799439012' };
            req.userId  = '507f1f77bcf86cd799439011';

            const mockUser = createMockUser({ _id: '507f1f77bcf86cd799439012' });
            mockUserFindById.mockResolvedValue(mockUser);
            mockUserFindByIdAndDelete.mockResolvedValue(mockUser);

            await deleteUser(req, res);

            expect(mockUserFindByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439012');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: expect.stringContaining('deleted'),
                })
            );
        });
    });

    // ──────────────────────────────────────────────────────────────────────────
    describe('getPublicUserProfile', () => {
        test('should return 400 for invalid ObjectId', async () => {
            req.params = { id: 'not-valid' };

            await getPublicUserProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Invalid user ID' });
        });

        test('should return 404 when user not found', async () => {
            req.params = { id: '507f1f77bcf86cd799439011' };
            mockUserFindById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

            await getPublicUserProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        test('should return public profile with computed stats', async () => {
            req.params = { id: '507f1f77bcf86cd799439011' };
            const mockUser = createMockUser({ privacySettings: {} });
            mockUserFindById.mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser),
            });
            mockPoolQuery.mockResolvedValue({
                rows: [{ uploads_count: '10', adopted_count: '7' }],
            });

            await getPublicUserProfile(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            const json = res.json.mock.calls[0][0];
            expect(json.success).toBe(true);
            expect(json.profile.uploads_count).toBe(10);
            expect(json.profile.adopted_count).toBe(7);
            expect(json.profile.success_rate).toBe(70);
        });
    });

    // ──────────────────────────────────────────────────────────────────────────
    describe('updateMe', () => {
        test('should return 404 when user not found', async () => {
            req.body = { name: 'New Name' };
            mockUserFindById.mockResolvedValue(null);

            await updateMe(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: 'User not found' });
        });

        test('should update allowed fields and return user data', async () => {
            req.body = { name: 'Updated Name', bio: 'Animal lover', city: 'Bucharest' };

            const mockUser = createMockUser();
            mockUserFindById.mockResolvedValue(mockUser);

            await updateMe(req, res);

            expect(mockUser.name).toBe('Updated Name');
            expect(mockUser.bio).toBe('Animal lover');
            expect(mockUser.city).toBe('Bucharest');
            expect(mockUser.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    message: 'Profile updated',
                })
            );
        });

        test('should return 500 on database error', async () => {
            req.body = { name: 'Name' };
            mockUserFindById.mockRejectedValue(new Error('DB error'));

            await updateMe(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });
});
