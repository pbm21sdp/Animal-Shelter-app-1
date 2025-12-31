/**
 * Mock for Mailtrap Configuration
 * Prevents actual API calls during testing
 */

import { jest } from '@jest/globals';

export const mailtrapClient = {
  send: jest.fn().mockResolvedValue({ success: true }),
};

export const sender = {
  email: 'test@example.com',
  name: 'Test Sender',
};
