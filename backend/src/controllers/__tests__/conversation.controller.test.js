import { jest, describe, test, expect, beforeEach } from '@jest/globals';

const mockPoolQuery = jest.fn();
const mockCheckContent = jest.fn();
const mockUserFindById = jest.fn();

jest.unstable_mockModule('../../config/database/connectPostgresDB.js', () => ({
    pool: { query: mockPoolQuery },
    connectPostgresDB: jest.fn(),
}));

jest.unstable_mockModule('../../utils/contentFilter.js', () => ({
    checkContent: mockCheckContent,
    refreshCache: jest.fn(),
}));

jest.unstable_mockModule('../../models/user.model.js', () => ({
    User: {
        findById: mockUserFindById,
        findOne: jest.fn(),
        find: jest.fn(),
    },
}));

const {
    sendMessage,
    startConversation,
    getConversations,
    getMessages,
    deleteConversation,
    getUnreadCount,
    getReceivedCount,
} = await import('../conversation.controller.js');

describe('Conversation Controller', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            body: {},
            params: {},
            query: {},
            userId: 'user-sender-id',
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        // Default: content passes filter
        mockCheckContent.mockResolvedValue({ ok: true, found: [] });
    });

    // ──────────────────────────────────────────────────────────────────────────
    describe('sendMessage', () => {
        test('should return 400 when content is empty', async () => {
            req.params = { id: 'conv-1' };
            req.body = { content: '   ' };

            await sendMessage(req, res);

            expect(mockCheckContent).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Empty message',
            });
        });

        test('should return 400 when content contains forbidden words', async () => {
            req.params = { id: 'conv-1' };
            req.body = { content: 'This contains badword' };
            mockCheckContent.mockResolvedValue({ ok: false, found: ['badword'] });

            await sendMessage(req, res);

            expect(mockPoolQuery).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: expect.stringContaining("isn't allowed"),
            });
        });

        test('should return 403 when user is not a participant', async () => {
            req.params = { id: 'conv-1' };
            req.body = { content: 'Hello there' };
            mockPoolQuery.mockResolvedValueOnce({ rows: [] }); // convCheck returns empty

            await sendMessage(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Not authorized',
            });
        });

        test('should send message and return 201 on success', async () => {
            req.params = { id: 'conv-42' };
            req.body = { content: 'Hello!' };
            req.userId = 'user-sender-id';

            const mockConv = {
                id: 'conv-42',
                participant_one: 'user-sender-id',
                participant_two: 'user-recipient-id',
            };

            mockPoolQuery
                .mockResolvedValueOnce({ rows: [mockConv] })                                // convCheck
                .mockResolvedValueOnce({ rows: [{ id: 'msg-1', created_at: new Date() }] }) // INSERT message
                .mockResolvedValueOnce({ rows: [] })                                         // UPDATE updated_at
                .mockResolvedValueOnce({ rows: [] });                                         // UPDATE replied_at

            await sendMessage(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ success: true });
        });

        test('should return 500 on database error', async () => {
            req.params = { id: 'conv-1' };
            req.body = { content: 'Hello' };
            mockPoolQuery.mockRejectedValue(new Error('DB error'));

            await sendMessage(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Server error' });
        });
    });

    // ──────────────────────────────────────────────────────────────────────────
    describe('startConversation', () => {
        test('should return 400 when recipient_id is missing', async () => {
            req.body = { message: 'Hello' };

            await startConversation(req, res);

            expect(mockCheckContent).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'recipient_id and message required',
            });
        });

        test('should return 400 when message is empty', async () => {
            req.body = { recipient_id: 'user-2', message: '   ' };

            await startConversation(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('should return 400 when message contains forbidden words', async () => {
            req.body = { recipient_id: 'user-2', message: 'offensive content' };
            mockCheckContent.mockResolvedValue({ ok: false, found: ['offensive'] });

            await startConversation(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ success: false, message: expect.stringContaining("isn't allowed") })
            );
        });

        test('should return 400 when sender tries to message themselves', async () => {
            req.userId = 'same-user';
            req.body = { recipient_id: 'same-user', message: 'Hello me' };

            await startConversation(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Cannot message yourself',
            });
        });

        test('should create new conversation and return 201', async () => {
            req.userId = 'sender-id';
            req.body = { recipient_id: 'recipient-id', message: 'Hi there', pet_id: 5 };

            mockPoolQuery
                .mockResolvedValueOnce({ rows: [] })                       // SELECT existing conv → none
                .mockResolvedValueOnce({ rows: [{ id: 'new-conv-id' }] }) // INSERT conversation
                .mockResolvedValueOnce({ rows: [] })                       // INSERT message
                .mockResolvedValueOnce({ rows: [] });                      // UPDATE updated_at

            await startConversation(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                conversation_id: 'new-conv-id',
            });
        });

        test('should reuse existing conversation and restore deleted state', async () => {
            req.userId = 'sender-id';
            req.body = { recipient_id: 'recipient-id', message: 'Hi again' };

            const existingConv = { id: 'existing-conv', participant_one: 'sender-id' };
            mockPoolQuery
                .mockResolvedValueOnce({ rows: [existingConv] })  // SELECT existing conv → found
                .mockResolvedValueOnce({ rows: [] })               // UPDATE deleted_by_one
                .mockResolvedValueOnce({ rows: [] })               // INSERT message
                .mockResolvedValueOnce({ rows: [] });              // UPDATE updated_at

            await startConversation(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                conversation_id: 'existing-conv',
            });
        });

        test('should return 500 on database error', async () => {
            req.body = { recipient_id: 'user-2', message: 'Hello' };
            mockPoolQuery.mockRejectedValue(new Error('DB error'));

            await startConversation(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Server error' });
        });
    });

    // ──────────────────────────────────────────────────────────────────────────
    describe('deleteConversation', () => {
        test('should return 404 when conversation not found', async () => {
            req.params = { id: 'conv-999' };
            mockPoolQuery.mockResolvedValue({ rows: [] });

            await deleteConversation(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Not found' });
        });

        test('should return 403 when user is not a participant', async () => {
            req.params = { id: 'conv-1' };
            req.userId = 'stranger-id';
            mockPoolQuery.mockResolvedValue({
                rows: [{ id: 'conv-1', participant_one: 'user-a', participant_two: 'user-b' }],
            });

            await deleteConversation(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
        });

        test('should set deleted_by_one when participant_one deletes', async () => {
            req.params = { id: 'conv-1' };
            req.userId = 'user-a';
            mockPoolQuery
                .mockResolvedValueOnce({ rows: [{ id: 'conv-1', participant_one: 'user-a', participant_two: 'user-b' }] })
                .mockResolvedValueOnce({ rows: [] });

            await deleteConversation(req, res);

            const updateSql = mockPoolQuery.mock.calls[1][0];
            expect(updateSql).toContain('deleted_by_one=true');
            expect(res.json).toHaveBeenCalledWith({ success: true });
        });

        test('should set deleted_by_two when participant_two deletes', async () => {
            req.params = { id: 'conv-1' };
            req.userId = 'user-b';
            mockPoolQuery
                .mockResolvedValueOnce({ rows: [{ id: 'conv-1', participant_one: 'user-a', participant_two: 'user-b' }] })
                .mockResolvedValueOnce({ rows: [] });

            await deleteConversation(req, res);

            const updateSql = mockPoolQuery.mock.calls[1][0];
            expect(updateSql).toContain('deleted_by_two=true');
        });
    });

    // ──────────────────────────────────────────────────────────────────────────
    describe('getUnreadCount', () => {
        test('should return unread message count', async () => {
            req.userId = 'user-1';
            mockPoolQuery.mockResolvedValue({ rows: [{ count: '5' }] });

            await getUnreadCount(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true, count: 5 });
        });

        test('should return 0 when no unread messages', async () => {
            mockPoolQuery.mockResolvedValue({ rows: [{ count: '0' }] });

            await getUnreadCount(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true, count: 0 });
        });

        test('should return 500 on database error', async () => {
            mockPoolQuery.mockRejectedValue(new Error('DB error'));

            await getUnreadCount(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    // ──────────────────────────────────────────────────────────────────────────
    describe('getMessages', () => {
        test('should return 403 when user is not a participant', async () => {
            req.params = { id: 'conv-1' };
            req.userId = 'outsider';
            mockPoolQuery.mockResolvedValueOnce({ rows: [] });

            await getMessages(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Not authorized' });
        });

        test('should return messages for authorized user', async () => {
            req.params = { id: 'conv-1' };
            req.userId = 'user-a';

            const mockConv = {
                id: 'conv-1',
                participant_one: 'user-a',
                participant_two: 'user-b',
                deleted_by_one: false,
            };
            const mockMessages = [
                { id: 'msg-1', content: 'Hello', sender_id: 'user-b' },
            ];

            mockPoolQuery
                .mockResolvedValueOnce({ rows: [mockConv] })      // convCheck
                .mockResolvedValueOnce({ rows: [] })               // UPDATE is_read
                .mockResolvedValueOnce({ rows: mockMessages });    // SELECT messages

            await getMessages(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                messages: mockMessages,
                conversation: mockConv,
            });
        });
    });
});
