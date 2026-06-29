import { jest, describe, test, expect, beforeEach } from '@jest/globals';

const mockPoolQuery = jest.fn();

jest.unstable_mockModule('../../config/database/connectPostgresDB.js', () => ({
    pool: { query: mockPoolQuery },
    connectPostgresDB: jest.fn(),
}));

const {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
} = await import('../notifications.controller.js');

describe('Notifications Controller', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            userId: 'user-123',
            query: {},
            params: {},
            body: {},
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    // ──────────────────────────────────────────────────────────────────────────
    describe('getNotifications', () => {
        test('should return notifications with defaults (limit=20, offset=0)', async () => {
            const mockRows = [{ id: 1, message: 'Test notification', is_read: false }];

            mockPoolQuery
                .mockResolvedValueOnce({ rows: mockRows })
                .mockResolvedValueOnce({ rows: [{ count: '1' }] });

            await getNotifications(req, res);

            expect(mockPoolQuery).toHaveBeenCalledTimes(2);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                notifications: mockRows,
                total: 1,
                limit: 20,
                offset: 0,
            });
        });

        test('should use custom limit and offset from query', async () => {
            req.query = { limit: '5', offset: '10' };

            mockPoolQuery
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [{ count: '0' }] });

            await getNotifications(req, res);

            const [firstCall] = mockPoolQuery.mock.calls;
            expect(firstCall[1]).toContain(5);
            expect(firstCall[1]).toContain(10);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ limit: 5, offset: 10 })
            );
        });

        test('should cap limit at 100 even if larger value is requested', async () => {
            req.query = { limit: '500' };

            mockPoolQuery
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [{ count: '0' }] });

            await getNotifications(req, res);

            const [firstCall] = mockPoolQuery.mock.calls;
            expect(firstCall[1]).toContain(100);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ limit: 100 }));
        });

        test('should clamp negative offset to 0', async () => {
            req.query = { offset: '-5' };

            mockPoolQuery
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [{ count: '0' }] });

            await getNotifications(req, res);

            const [firstCall] = mockPoolQuery.mock.calls;
            expect(firstCall[1]).toContain(0);
        });

        test('should return 500 on database error', async () => {
            mockPoolQuery.mockRejectedValue(new Error('DB timeout'));

            await getNotifications(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Failed to fetch notifications',
            });
        });
    });

    // ──────────────────────────────────────────────────────────────────────────
    describe('getUnreadCount', () => {
        test('should return unread count', async () => {
            mockPoolQuery.mockResolvedValue({ rows: [{ count: '7' }] });

            await getUnreadCount(req, res);

            expect(mockPoolQuery).toHaveBeenCalledWith(
                expect.stringContaining('is_read = false'),
                [req.userId]
            );
            expect(res.json).toHaveBeenCalledWith({ success: true, count: 7 });
        });

        test('should return 0 when no unread notifications', async () => {
            mockPoolQuery.mockResolvedValue({ rows: [{ count: '0' }] });

            await getUnreadCount(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true, count: 0 });
        });

        test('should return 500 on database error', async () => {
            mockPoolQuery.mockRejectedValue(new Error('DB error'));

            await getUnreadCount(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Failed to fetch unread count',
            });
        });
    });

    // ──────────────────────────────────────────────────────────────────────────
    describe('markAsRead', () => {
        test('should mark notification as read and return it', async () => {
            req.params = { id: '42' };
            const mockNotification = { id: 42, is_read: true, user_id: 'user-123' };

            mockPoolQuery.mockResolvedValue({ rows: [mockNotification] });

            await markAsRead(req, res);

            expect(mockPoolQuery).toHaveBeenCalledWith(
                expect.stringContaining('RETURNING *'),
                ['42', 'user-123']
            );
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                notification: mockNotification,
            });
        });

        test('should return 404 when notification not found or not owned', async () => {
            req.params = { id: '99' };
            mockPoolQuery.mockResolvedValue({ rows: [] });

            await markAsRead(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Notification not found',
            });
        });

        test('should include user_id in query to prevent cross-user access', async () => {
            req.params = { id: '5' };
            req.userId = 'different-user';
            mockPoolQuery.mockResolvedValue({ rows: [] });

            await markAsRead(req, res);

            const [, params] = mockPoolQuery.mock.calls[0];
            expect(params).toContain('different-user');
        });

        test('should return 500 on database error', async () => {
            req.params = { id: '1' };
            mockPoolQuery.mockRejectedValue(new Error('Connection lost'));

            await markAsRead(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Failed to mark notification as read',
            });
        });
    });

    // ──────────────────────────────────────────────────────────────────────────
    describe('markAllAsRead', () => {
        test('should mark all notifications as read for the user', async () => {
            mockPoolQuery.mockResolvedValue({ rows: [] });

            await markAllAsRead(req, res);

            expect(mockPoolQuery).toHaveBeenCalledWith(
                expect.stringContaining('is_read = false'),
                [req.userId]
            );
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'All notifications marked as read',
            });
        });

        test('should only update notifications for the requesting user', async () => {
            req.userId = 'specific-user-id';
            mockPoolQuery.mockResolvedValue({ rows: [] });

            await markAllAsRead(req, res);

            const [, params] = mockPoolQuery.mock.calls[0];
            expect(params).toContain('specific-user-id');
        });

        test('should return 500 on database error', async () => {
            mockPoolQuery.mockRejectedValue(new Error('DB error'));

            await markAllAsRead(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Failed to mark all notifications as read',
            });
        });
    });
});
