import { jest } from '@jest/globals';

export const checkContent = jest.fn().mockResolvedValue({ ok: true, found: [] });
export const refreshCache = jest.fn().mockResolvedValue(undefined);
