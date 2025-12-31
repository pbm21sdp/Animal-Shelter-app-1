/**
 * Mock for generateTokenAndSetCookie utility
 * Used in auth controller tests
 */

import { jest } from '@jest/globals';

export const generateTokenAndSetCookie = jest.fn((res, userId) => {
  const mockToken = 'mock-jwt-token-' + userId;
  return mockToken;
});
