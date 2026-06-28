import { jest, describe, test, expect, beforeEach } from '@jest/globals';

const mockPoolQuery = jest.fn();

jest.unstable_mockModule('../../config/database/connectPostgresDB.js', () => ({
    pool: { query: mockPoolQuery },
    connectPostgresDB: jest.fn(),
}));

const {
    getRejectReasons,
    toggleRejectReason,
    getForbiddenWords,
    addForbiddenWord,
    deleteForbiddenWord,
} = await import('../settings.controller.js');

describe('Settings Controller', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
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
    describe('getRejectReasons', () => {
        test('should return all reasons when activeOnly is not set', async () => {
            const mockReasons = [
                { id: 1, text: 'Incomplete form', is_active: true, display_order: 1 },
                { id: 2, text: 'No yard', is_active: false, display_order: 2 },
            ];
            mockPoolQuery.mockResolvedValue({ rows: mockReasons });

            await getRejectReasons(req, res);

            const sql = mockPoolQuery.mock.calls[0][0];
            expect(sql).not.toContain('WHERE');
            expect(res.json).toHaveBeenCalledWith({ success: true, reasons: mockReasons });
        });

        test('should filter active reasons when activeOnly=true', async () => {
            req.query = { activeOnly: 'true' };
            const mockReasons = [{ id: 1, text: 'Incomplete form', is_active: true }];
            mockPoolQuery.mockResolvedValue({ rows: mockReasons });

            await getRejectReasons(req, res);

            const sql = mockPoolQuery.mock.calls[0][0];
            expect(sql).toContain('WHERE is_active = true');
            expect(res.json).toHaveBeenCalledWith({ success: true, reasons: mockReasons });
        });

        test('should return all reasons when activeOnly=false', async () => {
            req.query = { activeOnly: 'false' };
            mockPoolQuery.mockResolvedValue({ rows: [] });

            await getRejectReasons(req, res);

            const sql = mockPoolQuery.mock.calls[0][0];
            expect(sql).not.toContain('WHERE is_active');
        });

        test('should return 500 on database error', async () => {
            mockPoolQuery.mockRejectedValue(new Error('DB error'));

            await getRejectReasons(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Failed to fetch reject reasons',
            });
        });
    });

    // ──────────────────────────────────────────────────────────────────────────
    describe('toggleRejectReason', () => {
        test('should toggle reason and return updated row', async () => {
            req.params = { id: '3' };
            const updatedReason = { id: 3, text: 'No yard', is_active: true };
            mockPoolQuery.mockResolvedValue({ rows: [updatedReason] });

            await toggleRejectReason(req, res);

            expect(mockPoolQuery).toHaveBeenCalledWith(
                expect.stringContaining('is_active = NOT is_active'),
                ['3']
            );
            expect(res.json).toHaveBeenCalledWith({ success: true, reason: updatedReason });
        });

        test('should return 404 when reason not found', async () => {
            req.params = { id: '999' };
            mockPoolQuery.mockResolvedValue({ rows: [] });

            await toggleRejectReason(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Reason not found',
            });
        });

        test('should return 500 on database error', async () => {
            req.params = { id: '1' };
            mockPoolQuery.mockRejectedValue(new Error('DB error'));

            await toggleRejectReason(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Failed to toggle reject reason',
            });
        });
    });

    // ──────────────────────────────────────────────────────────────────────────
    describe('getForbiddenWords', () => {
        test('should return all forbidden words ordered alphabetically', async () => {
            const mockWords = [
                { id: 1, word: 'badword' },
                { id: 2, word: 'other' },
            ];
            mockPoolQuery.mockResolvedValue({ rows: mockWords });

            await getForbiddenWords(req, res);

            const sql = mockPoolQuery.mock.calls[0][0];
            expect(sql).toContain('ORDER BY word ASC');
            expect(res.json).toHaveBeenCalledWith({ success: true, words: mockWords });
        });

        test('should return empty array when no words exist', async () => {
            mockPoolQuery.mockResolvedValue({ rows: [] });

            await getForbiddenWords(req, res);

            expect(res.json).toHaveBeenCalledWith({ success: true, words: [] });
        });

        test('should return 500 on database error', async () => {
            mockPoolQuery.mockRejectedValue(new Error('DB error'));

            await getForbiddenWords(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Failed to fetch forbidden words',
            });
        });
    });

    // ──────────────────────────────────────────────────────────────────────────
    describe('addForbiddenWord', () => {
        test('should add word and return 201', async () => {
            req.body = { word: 'BadWord' };
            const newWord = { id: 5, word: 'badword' };
            mockPoolQuery.mockResolvedValue({ rows: [newWord] });

            await addForbiddenWord(req, res);

            expect(mockPoolQuery).toHaveBeenCalledWith(
                expect.stringContaining('ON CONFLICT (word) DO NOTHING'),
                ['badword']
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ success: true, word: newWord });
        });

        test('should normalise word to lowercase and trim whitespace', async () => {
            req.body = { word: '  SpamWord  ' };
            mockPoolQuery.mockResolvedValue({ rows: [{ id: 1, word: 'spamword' }] });

            await addForbiddenWord(req, res);

            const [, params] = mockPoolQuery.mock.calls[0];
            expect(params[0]).toBe('spamword');
        });

        test('should return 400 when word is missing', async () => {
            req.body = {};

            await addForbiddenWord(req, res);

            expect(mockPoolQuery).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Word is required' });
        });

        test('should return 400 when word is only whitespace', async () => {
            req.body = { word: '   ' };

            await addForbiddenWord(req, res);

            expect(mockPoolQuery).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('should return 409 when word already exists', async () => {
            req.body = { word: 'existing' };
            mockPoolQuery.mockResolvedValue({ rows: [] }); // ON CONFLICT → no row returned

            await addForbiddenWord(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Word already exists',
            });
        });

        test('should return 500 on database error', async () => {
            req.body = { word: 'test' };
            mockPoolQuery.mockRejectedValue(new Error('DB error'));

            await addForbiddenWord(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Failed to add forbidden word',
            });
        });
    });

    // ──────────────────────────────────────────────────────────────────────────
    describe('deleteForbiddenWord', () => {
        test('should delete word and return success', async () => {
            req.params = { id: '10' };
            mockPoolQuery.mockResolvedValue({ rows: [{ id: 10, word: 'deleted' }] });

            await deleteForbiddenWord(req, res);

            expect(mockPoolQuery).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM forbidden_words'),
                ['10']
            );
            expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Word deleted' });
        });

        test('should return 404 when word not found', async () => {
            req.params = { id: '999' };
            mockPoolQuery.mockResolvedValue({ rows: [] });

            await deleteForbiddenWord(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Word not found',
            });
        });

        test('should return 500 on database error', async () => {
            req.params = { id: '1' };
            mockPoolQuery.mockRejectedValue(new Error('DB error'));

            await deleteForbiddenWord(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Failed to delete forbidden word',
            });
        });
    });
});
