import { jest, describe, test, expect, beforeEach } from '@jest/globals';

const mockPoolQuery = jest.fn();
const mockAxiosPost = jest.fn();

jest.unstable_mockModule('../../config/database/connectPostgresDB.js', () => ({
    pool: { query: mockPoolQuery },
    connectPostgresDB: jest.fn(),
}));

jest.unstable_mockModule('axios', () => ({
    default: { post: mockAxiosPost },
}));

const { getAdoptionPredictions } = await import('../prediction.controller.js');

describe('Prediction Controller', () => {
    let req, res;

    const buildRows = (count) =>
        Array.from({ length: count }, (_, i) => ({
            adopted_at: new Date(`2025-0${(i % 9) + 1}-01`),
        }));

    beforeEach(() => {
        jest.clearAllMocks();

        req = { body: {} };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    test('should return predictions for all pet types', async () => {
        req.body = { viewMode: 'daily', petType: 'all' };
        mockPoolQuery.mockResolvedValue({ rows: buildRows(10) });
        mockAxiosPost.mockResolvedValue({ data: { forecast: [1, 2, 3] } });

        await getAdoptionPredictions(req, res);

        const sql = mockPoolQuery.mock.calls[0][0];
        expect(sql).not.toContain('NOT IN');
        expect(sql).not.toContain('= $1');
        expect(mockAxiosPost).toHaveBeenCalledWith(
            expect.stringContaining('/api/ml/predict'),
            expect.objectContaining({ viewMode: 'daily', petType: 'all' }),
            expect.objectContaining({ timeout: 30000 })
        );
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: { forecast: [1, 2, 3] },
        });
    });

    test('should add type filter for specific pet type', async () => {
        req.body = { viewMode: 'weekly', petType: 'dog' };
        mockPoolQuery.mockResolvedValue({ rows: buildRows(8) });
        mockAxiosPost.mockResolvedValue({ data: {} });

        await getAdoptionPredictions(req, res);

        const sql = mockPoolQuery.mock.calls[0][0];
        const params = mockPoolQuery.mock.calls[0][1];
        expect(sql).toContain('= $1');
        expect(params).toContain('dog');
    });

    test('should use NOT IN filter for "other" pet type', async () => {
        req.body = { viewMode: 'monthly', petType: 'other' };
        mockPoolQuery.mockResolvedValue({ rows: buildRows(9) });
        mockAxiosPost.mockResolvedValue({ data: {} });

        await getAdoptionPredictions(req, res);

        const sql = mockPoolQuery.mock.calls[0][0];
        expect(sql).toContain("NOT IN ('dog', 'cat')");
    });

    test('should return 400 when fewer than 7 adopted animals exist', async () => {
        req.body = { viewMode: 'daily', petType: 'all' };
        mockPoolQuery.mockResolvedValue({ rows: buildRows(6) });

        await getAdoptionPredictions(req, res);

        expect(mockAxiosPost).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                message: expect.stringContaining('Not enough data'),
            })
        );
    });

    test('should return 400 with pet type name in message when filtered type has insufficient data', async () => {
        req.body = { viewMode: 'daily', petType: 'cat' };
        mockPoolQuery.mockResolvedValue({ rows: buildRows(3) });

        await getAdoptionPredictions(req, res);

        const json = res.json.mock.calls[0][0];
        expect(json.message).toContain('cats');
    });

    test('should return 503 when ML service is not running (ECONNREFUSED)', async () => {
        req.body = { viewMode: 'daily', petType: 'all' };
        mockPoolQuery.mockResolvedValue({ rows: buildRows(10) });

        const connError = new Error('connect ECONNREFUSED');
        connError.code = 'ECONNREFUSED';
        mockAxiosPost.mockRejectedValue(connError);

        await getAdoptionPredictions(req, res);

        expect(res.status).toHaveBeenCalledWith(503);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'ML service is not running. Please start the Python service first.',
        });
    });

    test('should return ML service error message when Flask returns an error', async () => {
        req.body = { viewMode: 'daily', petType: 'all' };
        mockPoolQuery.mockResolvedValue({ rows: buildRows(10) });
        mockAxiosPost.mockRejectedValue({
            message: 'Request failed with status code 422',
            response: { data: { error: 'Invalid input format' } },
        });

        await getAdoptionPredictions(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: 'Invalid input format',
        });
    });

    test('should return 500 on database query error', async () => {
        req.body = { viewMode: 'daily', petType: 'all' };
        mockPoolQuery.mockRejectedValue(new Error('DB connection lost'));

        await getAdoptionPredictions(req, res);

        expect(mockAxiosPost).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: false })
        );
    });
});
