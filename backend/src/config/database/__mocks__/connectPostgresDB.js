import { jest } from '@jest/globals';

export const pool = {
    query: jest.fn(),
};

export const connectPostgresDB = jest.fn().mockResolvedValue(pool);
