/**
 * Stripe Mock Utilities for Testing
 * Provides mock response factories for Stripe objects
 */

import { jest } from '@jest/globals';

/**
 * Creates a mock Stripe checkout session object
 * @param {Object} overrides - Properties to override in the mock session
 * @returns {Object} Mock Stripe session
 */
export const createMockStripeSession = (overrides = {}) => ({
  id: 'cs_test_mock123',
  object: 'checkout.session',
  url: 'https://checkout.stripe.com/mock',
  status: 'open',
  payment_status: 'unpaid',
  payment_intent: null,
  customer_email: 'test@example.com',
  amount_total: 1000,
  amount_subtotal: 1000,
  currency: 'eur',
  mode: 'payment',
  metadata: {
    userId: '507f1f77bcf86cd799439011',
    amountInEuros: '10',
  },
  expires_at: Math.floor(Date.now() / 1000) + 1800, // 30 minutes from now
  created: Math.floor(Date.now() / 1000),
  ...overrides,
});

/**
 * Creates a mock Stripe webhook event object
 * @param {string} type - Event type (e.g., 'checkout.session.completed')
 * @param {Object} sessionOverrides - Properties to override in the session object
 * @returns {Object} Mock webhook event
 */
export const createMockWebhookEvent = (type, sessionOverrides = {}) => ({
  id: `evt_test_${Math.random().toString(36).substr(2, 9)}`,
  object: 'event',
  api_version: '2023-10-16',
  created: Math.floor(Date.now() / 1000),
  type,
  data: {
    object: createMockStripeSession(sessionOverrides),
  },
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: null,
    idempotency_key: null,
  },
});

/**
 * Creates a mock completed Stripe session
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock completed session
 */
export const createMockCompletedSession = (overrides = {}) =>
  createMockStripeSession({
    status: 'complete',
    payment_status: 'paid',
    payment_intent: 'pi_test_mock123',
    ...overrides,
  });

/**
 * Creates a mock expired Stripe session
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock expired session
 */
export const createMockExpiredSession = (overrides = {}) =>
  createMockStripeSession({
    status: 'expired',
    payment_status: 'unpaid',
    ...overrides,
  });

/**
 * Creates a mock donation object matching MongoDB schema
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock donation with save method
 */
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
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };

  // Add mock save method that returns a resolved promise
  donation.save = jest.fn().mockResolvedValue(donation);

  return donation;
};
