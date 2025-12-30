/**
 * Mock for Adoption Model
 */

import { jest } from '@jest/globals';

export const Adoption = jest.fn().mockImplementation((data) => ({
  ...data,
  save: jest.fn().mockResolvedValue({ _id: 'test-id', ...data }),
}));

Adoption.findOne = jest.fn();
Adoption.find = jest.fn();
Adoption.findById = jest.fn();
Adoption.findByIdAndDelete = jest.fn();
