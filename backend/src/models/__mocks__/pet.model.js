/**
 * Mock for Pet Model
 */

import { jest } from '@jest/globals';

export const PetModel = {
  findById: jest.fn(),
  updateAdoptionStatus: jest.fn(),
};
