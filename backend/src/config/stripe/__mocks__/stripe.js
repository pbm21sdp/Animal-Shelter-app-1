/**
 * Mock Stripe SDK for Testing
 * Provides mocked Stripe API methods
 */

import { jest } from '@jest/globals';

const stripeMock = {
  checkout: {
    sessions: {
      create: jest.fn(),
      retrieve: jest.fn(),
      expire: jest.fn(),
    },
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
};

export default stripeMock;
