/**
 * Mock for User Model
 */

import { jest } from '@jest/globals';

export const User = {
  findById: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
};
