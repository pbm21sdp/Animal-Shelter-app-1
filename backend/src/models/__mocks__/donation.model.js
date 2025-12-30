/**
 * Mock Donation Model for Testing
 * Mocks Mongoose Donation model methods
 */

import { jest } from '@jest/globals';

// Mock donation data factory
export const createMockDonation = (overrides = {}) => {
  const donation = {
    _id: '507f1f77bcf86cd799439012',
    user: '507f1f77bcf86cd799439011',
    email: 'user@example.com',
    amount: 10,
    currency: 'eur',
    stripeSessionId: 'cs_test_mock123',
    paymentIntentId: null,
    status: 'pending',
    createdAt: new Date('2025-01-01T12:00:00Z'),
    updatedAt: new Date('2025-01-01T12:00:00Z'),
    ...overrides,
    save: jest.fn().mockImplementation(function() {
      return Promise.resolve(this);
    }),
  };

  return donation;
};

// Mock chainable query methods
const createQueryChain = (returnValue) => {
  const chain = {
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(returnValue),
  };

  // Make the chain itself thenable (so it can be awaited directly)
  chain.then = (resolve, reject) => {
    return chain.exec().then(resolve, reject);
  };
  chain.catch = (reject) => {
    return chain.exec().catch(reject);
  };

  return chain;
};

// Donation model mock
export const Donation = {
  // Static methods
  create: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  findByIdAndDelete: jest.fn(),
  countDocuments: jest.fn(),

  // Helper to reset all mocks
  __resetMocks: () => {
    Object.values(Donation).forEach(mockFn => {
      if (typeof mockFn === 'function' && mockFn.mockReset) {
        mockFn.mockReset();
      }
    });
  },
};

// Default implementations
Donation.create.mockImplementation((data) => {
  return Promise.resolve(createMockDonation(data));
});

Donation.find.mockImplementation(() => {
  return createQueryChain([createMockDonation()]);
});

Donation.findOne.mockResolvedValue(createMockDonation());
Donation.findById.mockResolvedValue(createMockDonation());
Donation.findByIdAndDelete.mockResolvedValue(createMockDonation());
Donation.countDocuments.mockResolvedValue(1);
