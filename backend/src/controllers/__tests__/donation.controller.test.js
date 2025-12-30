/**
 * Unit Tests for Donation Controller
 * Tests all donation controller functions with Stripe integration mocking
 */

import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import {
  createCheckoutSession,
  expireOldSessions,
  handleStripeWebhook,
  getAllDonations,
  getUserDonations,
  getUserDonationsById,
  verifyDonation,
  cleanupAbandonedDonationsTest,
  updateDonation,
  deleteDonation,
} from '../donation.controller.js';

// Mock dependencies
jest.mock('../../models/donation.model.js');
jest.mock('../../models/user.model.js');
jest.mock('../../config/stripe/stripe.js');

// Import mocked modules
import { Donation } from '../../models/donation.model.js';
import { User } from '../../models/user.model.js';
import stripe from '../../config/stripe/stripe.js';
import {
  createMockStripeSession,
  createMockWebhookEvent,
  createMockCompletedSession,
  createMockExpiredSession,
  createMockDonation,
} from '../../__tests__/helpers/stripeMock.js';

describe('Donation Controller', () => {
  let req, res;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock request and response objects
    req = {
      body: {},
      params: {},
      query: {},
      headers: {},
      userId: '507f1f77bcf86cd799439011', // Valid MongoDB ObjectId
      isAdmin: false,
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(), // For webhook handler
    };
  });

  describe('createCheckoutSession', () => {
    const validBody = {
      userId: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
    };

    test('should create checkout session with default amount (1000 cents)', async () => {
      req.body = validBody;

      const mockSession = createMockStripeSession({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      });

      // Directly assign mock functions (pattern from adoption controller)
      stripe.checkout.sessions.create = jest.fn().mockResolvedValue(mockSession);

      Donation.find = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const mockDonation = createMockDonation({
        stripeSessionId: mockSession.id,
      });
      Donation.create = jest.fn().mockResolvedValue(mockDonation);

      await createCheckoutSession(req, res);

      // Verify Stripe was called with correct amount
      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: expect.arrayContaining([
            expect.objectContaining({
              price_data: expect.objectContaining({
                unit_amount: 1000,
              }),
            }),
          ]),
        })
      );

      // Verify donation was created
      expect(Donation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user: validBody.userId,
          email: validBody.email,
          amount: 10, // 1000 cents = 10 euros
          status: 'pending',
        })
      );

      // Verify response
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          sessionId: mockSession.id,
          url: mockSession.url,
        })
      );
    });

    test('should create checkout session with custom amount', async () => {
      req.body = {
        ...validBody,
        amountInCents: 2500, // €25
      };

      const mockSession = createMockStripeSession();
      stripe.checkout.sessions.create = jest.fn().mockResolvedValue(mockSession);
      Donation.find = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });
      Donation.create = jest.fn().mockResolvedValue(createMockDonation());

      await createCheckoutSession(req, res);

      // Verify custom amount was used
      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: expect.arrayContaining([
            expect.objectContaining({
              price_data: expect.objectContaining({
                unit_amount: 2500,
              }),
            }),
          ]),
        })
      );

      // Verify amount in euros for database
      expect(Donation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 25,
        })
      );
    });

    test('should expire old pending sessions before creating new one', async () => {
      req.body = validBody;

      const oldDonation = createMockDonation({
        stripeSessionId: 'cs_old_session',
        createdAt: new Date(Date.now() - 40 * 60 * 1000), // 40 minutes ago
      });

      // Mock finding old sessions - Mongoose returns promise directly
      Donation.find = jest.fn().mockResolvedValue([oldDonation]);

      const oldStripeSession = createMockStripeSession({
        id: 'cs_old_session',
        status: 'open',
      });
      stripe.checkout.sessions.retrieve = jest.fn().mockResolvedValue(oldStripeSession);
      stripe.checkout.sessions.expire = jest.fn().mockResolvedValue({ status: 'expired' });

      const newMockSession = createMockStripeSession();
      stripe.checkout.sessions.create = jest.fn().mockResolvedValue(newMockSession);
      Donation.create = jest.fn().mockResolvedValue(createMockDonation());

      await createCheckoutSession(req, res);

      // Verify old session was expired
      expect(stripe.checkout.sessions.expire).toHaveBeenCalledWith('cs_old_session');
      expect(oldDonation.save).toHaveBeenCalled();
      expect(oldDonation.status).toBe('canceled');

      // Verify new session was created
      expect(stripe.checkout.sessions.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should handle Stripe session creation failure', async () => {
      req.body = validBody;

      Donation.find = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const error = new Error('Stripe API error');
      stripe.checkout.sessions.create = jest.fn().mockRejectedValue(error);

      await createCheckoutSession(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Failed to create checkout session',
        })
      );
    });

    test('should handle database save failure', async () => {
      req.body = validBody;

      Donation.find = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const mockSession = createMockStripeSession();
      stripe.checkout.sessions.create = jest.fn().mockResolvedValue(mockSession);

      const dbError = new Error('Database error');
      Donation.create = jest.fn().mockRejectedValue(dbError);

      await createCheckoutSession(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Failed to create checkout session',
        })
      );
    });
  });

  describe('expireOldSessions', () => {
    const userId = '507f1f77bcf86cd799439011';

    test('should expire 2 old pending sessions successfully', async () => {
      const oldDonation1 = createMockDonation({
        _id: 'donation1',
        stripeSessionId: 'cs_old_1',
        createdAt: new Date(Date.now() - 40 * 60 * 1000),
      });

      const oldDonation2 = createMockDonation({
        _id: 'donation2',
        stripeSessionId: 'cs_old_2',
        createdAt: new Date(Date.now() - 50 * 60 * 1000),
      });

      // Mongoose .find() returns a promise directly when awaited (no .exec())
      Donation.find = jest.fn().mockResolvedValue([oldDonation1, oldDonation2]);

      stripe.checkout.sessions.retrieve = jest.fn().mockResolvedValue(
        createMockStripeSession({ status: 'open' })
      );
      stripe.checkout.sessions.expire = jest.fn().mockResolvedValue({ status: 'expired' });

      const count = await expireOldSessions(userId);

      expect(count).toBe(2);
      expect(stripe.checkout.sessions.expire).toHaveBeenCalledTimes(2);
      expect(oldDonation1.save).toHaveBeenCalled();
      expect(oldDonation2.save).toHaveBeenCalled();
      expect(oldDonation1.status).toBe('canceled');
      expect(oldDonation2.status).toBe('canceled');
    });

    test('should return 0 when no old sessions exist', async () => {
      Donation.find = jest.fn().mockResolvedValue([]);

      const count = await expireOldSessions(userId);

      expect(count).toBe(0);
      expect(stripe.checkout.sessions.expire).not.toHaveBeenCalled();
    });

    test('should handle Stripe expiration failures gracefully and continue', async () => {
      const oldDonation1 = createMockDonation({
        stripeSessionId: 'cs_old_1',
        createdAt: new Date(Date.now() - 40 * 60 * 1000),
      });

      const oldDonation2 = createMockDonation({
        stripeSessionId: 'cs_old_2',
        createdAt: new Date(Date.now() - 50 * 60 * 1000),
      });

      Donation.find = jest.fn().mockResolvedValue([oldDonation1, oldDonation2]);

      // First session retrieval fails, second succeeds
      const retrieveMock = jest.fn();
      retrieveMock
        .mockRejectedValueOnce(new Error('Stripe error'))
        .mockResolvedValueOnce(createMockStripeSession({ status: 'open' }));
      stripe.checkout.sessions.retrieve = retrieveMock;

      stripe.checkout.sessions.expire = jest.fn().mockResolvedValue({ status: 'expired' });

      const count = await expireOldSessions(userId);

      // Should still process both donations
      expect(count).toBe(2);
      expect(oldDonation1.save).toHaveBeenCalled();
      expect(oldDonation2.save).toHaveBeenCalled();
      expect(stripe.checkout.sessions.expire).toHaveBeenCalledTimes(1); // Only called for second one
    });

    test('should return 0 and log error when database query fails', async () => {
      Donation.find = jest.fn().mockRejectedValue(new Error('Database error'));

      const count = await expireOldSessions(userId);

      expect(count).toBe(0);
      expect(stripe.checkout.sessions.expire).not.toHaveBeenCalled();
    });
  });

  describe('handleStripeWebhook', () => {
    beforeEach(() => {
      req.headers['stripe-signature'] = 'test_signature';
    });

    test('should handle checkout.session.completed event successfully', async () => {
      const completedEvent = createMockWebhookEvent('checkout.session.completed', {
        id: 'cs_test_123',
        status: 'complete',
        payment_status: 'paid',
        payment_intent: 'pi_test_123',
      });

      stripe.webhooks.constructEvent = jest.fn().mockReturnValue(completedEvent);

      const mockDonation = createMockDonation({
        stripeSessionId: 'cs_test_123',
        status: 'pending',
      });
      Donation.findOne = jest.fn().mockResolvedValue(mockDonation);

      await handleStripeWebhook(req, res);

      // Verify donation was updated
      expect(Donation.findOne).toHaveBeenCalledWith({ stripeSessionId: 'cs_test_123' });
      expect(mockDonation.status).toBe('completed');
      expect(mockDonation.paymentIntentId).toBe('pi_test_123');
      expect(mockDonation.save).toHaveBeenCalled();

      // Webhook always returns 200
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ received: true });
    });

    test('should handle checkout.session.expired event successfully', async () => {
      const expiredEvent = createMockWebhookEvent('checkout.session.expired', {
        id: 'cs_test_expired',
        status: 'expired',
      });

      stripe.webhooks.constructEvent = jest.fn().mockReturnValue(expiredEvent);

      const mockDonation = createMockDonation({
        stripeSessionId: 'cs_test_expired',
        status: 'pending',
      });
      Donation.findOne = jest.fn().mockResolvedValue(mockDonation);

      await handleStripeWebhook(req, res);

      // Verify donation was marked as canceled
      expect(mockDonation.status).toBe('canceled');
      expect(mockDonation.save).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ received: true });
    });

    test('should ignore unhandled event types', async () => {
      const unknownEvent = createMockWebhookEvent('payment_intent.created');

      stripe.webhooks.constructEvent = jest.fn().mockReturnValue(unknownEvent);

      await handleStripeWebhook(req, res);

      // Should still return 200 but not query database
      expect(Donation.findOne).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ received: true });
    });

    test('should reject webhook with invalid signature', async () => {
      const signatureError = new Error('Invalid signature');
      stripe.webhooks.constructEvent = jest.fn().mockImplementation(() => {
        throw signatureError;
      });

      await handleStripeWebhook(req, res);

      // Should return 400 with error message using res.send()
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.stringContaining('Webhook Error')
      );
    });

    test('should handle donation not found gracefully (return 200)', async () => {
      const completedEvent = createMockWebhookEvent('checkout.session.completed', {
        id: 'cs_nonexistent',
      });

      stripe.webhooks.constructEvent = jest.fn().mockReturnValue(completedEvent);
      Donation.findOne = jest.fn().mockResolvedValue(null); // Donation not found

      await handleStripeWebhook(req, res);

      // Should still return 200 (webhook acknowledged)
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ received: true });
    });

    test('should handle database update failure gracefully (return 200)', async () => {
      const completedEvent = createMockWebhookEvent('checkout.session.completed', {
        id: 'cs_test_123',
      });

      stripe.webhooks.constructEvent = jest.fn().mockReturnValue(completedEvent);

      const mockDonation = createMockDonation({
        stripeSessionId: 'cs_test_123',
      });
      mockDonation.save.mockRejectedValue(new Error('Database error'));
      Donation.findOne = jest.fn().mockResolvedValue(mockDonation);

      await handleStripeWebhook(req, res);

      // Even with error, webhook returns 200 (error is logged)
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ received: true });
    });

    test('should update donation with payment details on completion', async () => {
      const completedEvent = createMockWebhookEvent('checkout.session.completed', {
        id: 'cs_payment_test',
        payment_intent: 'pi_payment_123',
      });

      stripe.webhooks.constructEvent = jest.fn().mockReturnValue(completedEvent);

      const mockDonation = createMockDonation({
        stripeSessionId: 'cs_payment_test',
        paymentIntentId: null,
      });
      Donation.findOne = jest.fn().mockResolvedValue(mockDonation);

      await handleStripeWebhook(req, res);

      // Verify payment intent was added
      expect(mockDonation.paymentIntentId).toBe('pi_payment_123');
      expect(mockDonation.status).toBe('completed');
      expect(mockDonation.save).toHaveBeenCalled();
    });
  });

  describe('getAllDonations', () => {
    test('should return paginated donations with user population', async () => {
      req.query = { page: '1', limit: '10' };

      const mockDonations = [
        createMockDonation({ _id: 'donation1' }),
        createMockDonation({ _id: 'donation2' }),
      ];

      const donationsWithUsers = mockDonations.map(d => ({
        ...d,
        user: {
          _id: d.user,
          name: 'Test User',
          email: 'test@example.com',
        },
        toObject: () => ({
          ...d,
          user: {
            _id: d.user,
            name: 'Test User',
            email: 'test@example.com',
          }
        })
      }));

      const mockChain = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn(),
      };
      // Make the chain thenable so it can be awaited directly
      mockChain.skip.mockResolvedValue(donationsWithUsers);

      Donation.find = jest.fn().mockReturnValue(mockChain);
      Donation.countDocuments = jest.fn().mockResolvedValue(25);

      await getAllDonations(req, res);

      expect(Donation.find).toHaveBeenCalledWith({});
      expect(mockChain.populate).toHaveBeenCalledWith('user', 'name email');
      expect(mockChain.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockChain.limit).toHaveBeenCalledWith(10);
      expect(mockChain.skip).toHaveBeenCalledWith(0);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          donations: expect.any(Array),
          pagination: {
            currentPage: 1,
            totalPages: 3,
            totalItems: 25,
            itemsPerPage: 10,
          },
        })
      );
    });

    test('should filter donations by status', async () => {
      req.query = { status: 'completed', page: '1', limit: '10' };

      const mockChain = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };

      Donation.find = jest.fn().mockReturnValue(mockChain);
      Donation.countDocuments = jest.fn().mockResolvedValue(0);

      await getAllDonations(req, res);

      expect(Donation.find).toHaveBeenCalledWith({ status: 'completed' });
    });

    test('should filter donations by userId', async () => {
      req.query = { userId: '507f1f77bcf86cd799439011', page: '1', limit: '10' };

      const mockChain = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };

      Donation.find = jest.fn().mockReturnValue(mockChain);
      Donation.countDocuments = jest.fn().mockResolvedValue(0);

      await getAllDonations(req, res);

      expect(Donation.find).toHaveBeenCalledWith({ user: '507f1f77bcf86cd799439011' });
    });

    test('should sort donations by different fields', async () => {
      req.query = { sortBy: 'amount', sortOrder: 'asc', page: '1', limit: '10' };

      const mockChain = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };

      Donation.find = jest.fn().mockReturnValue(mockChain);
      Donation.countDocuments = jest.fn().mockResolvedValue(0);

      await getAllDonations(req, res);

      expect(mockChain.sort).toHaveBeenCalledWith({ amount: 1 });
    });

    test('should handle database query failure', async () => {
      req.query = { page: '1', limit: '10' };

      const mockChain = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      Donation.find = jest.fn().mockReturnValue(mockChain);

      await getAllDonations(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Error fetching donations',
        })
      );
    });
  });

  describe('getUserDonations', () => {
    test('should return current user donations sorted by createdAt desc', async () => {
      const mockDonations = [
        createMockDonation({ _id: 'donation1' }),
        createMockDonation({ _id: 'donation2' }),
      ];

      const mockChain = {
        sort: jest.fn().mockReturnThis(),
      };
      // Mongoose allows awaiting the chain directly
      mockChain.sort.mockResolvedValue(mockDonations);

      Donation.find = jest.fn().mockReturnValue(mockChain);

      await getUserDonations(req, res);

      expect(Donation.find).toHaveBeenCalledWith({ user: req.userId });
      expect(mockChain.sort).toHaveBeenCalledWith({ createdAt: -1 });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          donations: mockDonations,
        })
      );
    });

    test('should handle database query failure', async () => {
      const mockChain = {
        sort: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      Donation.find = jest.fn().mockReturnValue(mockChain);

      await getUserDonations(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Error fetching donations',
        })
      );
    });
  });

  describe('getUserDonationsById', () => {
    test('should return specific user donations', async () => {
      const targetUserId = '507f1f77bcf86cd799439013';
      req.params.userId = targetUserId;

      const mockUser = {
        _id: targetUserId,
        name: 'Test User',
        email: 'test@example.com',
      };
      User.findById = jest.fn().mockResolvedValue(mockUser);

      const mockDonations = [createMockDonation({ user: targetUserId })];
      const mockChain = {
        sort: jest.fn().mockResolvedValue(mockDonations),
      };
      Donation.find = jest.fn().mockReturnValue(mockChain);

      await getUserDonationsById(req, res);

      expect(User.findById).toHaveBeenCalledWith(targetUserId);
      expect(Donation.find).toHaveBeenCalledWith({ user: targetUserId });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          donations: mockDonations,
        })
      );
    });

    test('should return 400 for invalid userId format', async () => {
      req.params.userId = 'invalid_id'; // Not a valid ObjectId

      await getUserDonationsById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid user ID format',
        })
      );
    });

    test('should return 404 when user not found', async () => {
      req.params.userId = '507f1f77bcf86cd799439013';

      User.findById = jest.fn().mockResolvedValue(null);

      await getUserDonationsById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'User not found',
        })
      );
    });

    test('should handle database query failure', async () => {
      req.params.userId = '507f1f77bcf86cd799439013';

      User.findById = jest.fn().mockRejectedValue(new Error('Database error'));

      await getUserDonationsById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Error fetching user donations',
        })
      );
    });
  });

  describe('verifyDonation', () => {
    test('should return completed donation without Stripe check', async () => {
      req.params.sessionId = 'cs_test_completed';

      const mockDonation = createMockDonation({
        stripeSessionId: 'cs_test_completed',
        status: 'completed',
      });
      Donation.findOne = jest.fn().mockResolvedValue(mockDonation);

      await verifyDonation(req, res);

      // Should not call Stripe API for completed donations
      expect(stripe.checkout.sessions.retrieve).not.toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          donation: mockDonation,
        })
      );
    });

    test('should update pending donation from Stripe and return', async () => {
      req.params.sessionId = 'cs_test_pending';

      const mockDonation = createMockDonation({
        stripeSessionId: 'cs_test_pending',
        status: 'pending',
      });
      Donation.findOne = jest.fn().mockResolvedValue(mockDonation);

      const completedStripeSession = createMockCompletedSession({
        id: 'cs_test_pending',
        payment_intent: 'pi_new_123',
      });
      stripe.checkout.sessions.retrieve = jest.fn().mockResolvedValue(completedStripeSession);

      await verifyDonation(req, res);

      // Should call Stripe and update donation
      expect(stripe.checkout.sessions.retrieve).toHaveBeenCalledWith('cs_test_pending');
      expect(mockDonation.status).toBe('completed');
      expect(mockDonation.paymentIntentId).toBe('pi_new_123');
      expect(mockDonation.save).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should update donation with payment details from Stripe', async () => {
      req.params.sessionId = 'cs_test_update';

      const mockDonation = createMockDonation({
        stripeSessionId: 'cs_test_update',
        status: 'pending',
        paymentIntentId: null,
      });
      Donation.findOne = jest.fn().mockResolvedValue(mockDonation);

      const completedStripeSession = createMockCompletedSession({
        id: 'cs_test_update',
        payment_intent: 'pi_updated_123',
      });
      stripe.checkout.sessions.retrieve = jest.fn().mockResolvedValue(completedStripeSession);

      await verifyDonation(req, res);

      expect(mockDonation.paymentIntentId).toBe('pi_updated_123');
      expect(mockDonation.status).toBe('completed');
    });

    test('should return 404 when session not found in database', async () => {
      req.params.sessionId = 'cs_nonexistent';

      Donation.findOne = jest.fn().mockResolvedValue(null);

      await verifyDonation(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Donation not found',
        })
      );
    });

    test('should handle Stripe retrieval failure gracefully', async () => {
      req.params.sessionId = 'cs_test_error';

      const mockDonation = createMockDonation({
        stripeSessionId: 'cs_test_error',
        status: 'pending',
      });
      Donation.findOne = jest.fn().mockResolvedValue(mockDonation);

      stripe.checkout.sessions.retrieve = jest.fn().mockRejectedValue(new Error('Stripe error'));

      await verifyDonation(req, res);

      // Stripe error is caught and logged, but donation is still returned with 200
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          donation: mockDonation,
        })
      );
    });
  });

  describe('cleanupAbandonedDonationsTest', () => {
    test('should expire old pending donations with default threshold (60 min)', async () => {
      const oldDonation = createMockDonation({
        stripeSessionId: 'cs_old_abandoned',
        createdAt: new Date(Date.now() - 70 * 60 * 1000), // 70 minutes ago
      });

      Donation.find = jest.fn().mockResolvedValue([oldDonation]);

      stripe.checkout.sessions.retrieve = jest.fn().mockResolvedValue(
        createMockStripeSession({ status: 'open' })
      );
      stripe.checkout.sessions.expire = jest.fn().mockResolvedValue({ status: 'expired' });

      await cleanupAbandonedDonationsTest(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          expiredCount: 1,
          timeThreshold: expect.any(String),
        })
      );
    });

    test('should use custom threshold from query param', async () => {
      req.query.minutes = '120'; // 2 hours

      const oldDonation = createMockDonation({
        stripeSessionId: 'cs_old_abandoned',
        createdAt: new Date(Date.now() - 150 * 60 * 1000), // 2.5 hours ago
      });

      Donation.find = jest.fn().mockResolvedValue([oldDonation]);

      stripe.checkout.sessions.retrieve = jest.fn().mockResolvedValue(
        createMockStripeSession({ status: 'open' })
      );
      stripe.checkout.sessions.expire = jest.fn().mockResolvedValue({ status: 'expired' });

      await cleanupAbandonedDonationsTest(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          expiredCount: 1,
        })
      );
    });

    test('should return processedDonations array with expired sessions', async () => {
      const oldDonations = [
        createMockDonation({ stripeSessionId: 'cs_1', _id: 'donation1' }),
        createMockDonation({ stripeSessionId: 'cs_2', _id: 'donation2' }),
      ];

      Donation.find = jest.fn().mockResolvedValue(oldDonations);

      stripe.checkout.sessions.retrieve = jest.fn().mockResolvedValue(
        createMockStripeSession({ status: 'open' })
      );
      stripe.checkout.sessions.expire = jest.fn().mockResolvedValue({ status: 'expired' });

      await cleanupAbandonedDonationsTest(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          processedDonations: expect.arrayContaining([
            expect.objectContaining({ stripeSessionId: 'cs_1' }),
            expect.objectContaining({ stripeSessionId: 'cs_2' }),
          ]),
        })
      );
    });

    test('should handle partial failures (some succeed, some fail)', async () => {
      const donations = [
        createMockDonation({ stripeSessionId: 'cs_success', _id: 'donation1' }),
        createMockDonation({ stripeSessionId: 'cs_fail', _id: 'donation2' }),
      ];

      Donation.find = jest.fn().mockResolvedValue(donations);

      stripe.checkout.sessions.retrieve = jest.fn().mockResolvedValue(
        createMockStripeSession({ status: 'open' })
      );

      // First expires successfully, second fails
      const expireMock = jest.fn();
      expireMock
        .mockResolvedValueOnce({ status: 'expired' })
        .mockRejectedValueOnce(new Error('Stripe error'));
      stripe.checkout.sessions.expire = expireMock;

      await cleanupAbandonedDonationsTest(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          expiredCount: 2, // Both processed, even if one failed
          errors: expect.arrayContaining([
            expect.objectContaining({
              stripeSessionId: 'cs_fail',
            }),
          ]),
        })
      );
    });
  });

  describe('updateDonation', () => {
    test('should update donation amount', async () => {
      req.params.id = '507f1f77bcf86cd799439012';
      req.body = { amount: 50 };

      const mockDonation = createMockDonation({ amount: 10 });
      Donation.findById = jest.fn().mockResolvedValue(mockDonation);

      await updateDonation(req, res);

      expect(mockDonation.amount).toBe(50);
      expect(mockDonation.save).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          donation: mockDonation,
        })
      );
    });

    test('should update donation status', async () => {
      req.params.id = '507f1f77bcf86cd799439012';
      req.body = { status: 'completed' };

      const mockDonation = createMockDonation({ status: 'pending' });
      Donation.findById = jest.fn().mockResolvedValue(mockDonation);

      await updateDonation(req, res);

      expect(mockDonation.status).toBe('completed');
      expect(mockDonation.save).toHaveBeenCalled();
    });

    test('should update multiple fields at once', async () => {
      req.params.id = '507f1f77bcf86cd799439012';
      req.body = {
        amount: 100,
        status: 'completed',
      };

      const mockDonation = createMockDonation({ amount: 10, status: 'pending' });
      Donation.findById = jest.fn().mockResolvedValue(mockDonation);

      await updateDonation(req, res);

      expect(mockDonation.amount).toBe(100);
      expect(mockDonation.status).toBe('completed');
      expect(mockDonation.save).toHaveBeenCalled();
    });

    test('should return 400 for invalid donation ID format', async () => {
      req.params.id = 'invalid_id';

      await updateDonation(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid donation ID format',
        })
      );
    });

    test('should return 404 when donation not found', async () => {
      req.params.id = '507f1f77bcf86cd799439012';

      Donation.findById = jest.fn().mockResolvedValue(null);

      await updateDonation(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Donation not found',
        })
      );
    });
  });

  describe('deleteDonation', () => {
    test('should delete donation by ID', async () => {
      req.params.id = '507f1f77bcf86cd799439012';

      const mockDonation = createMockDonation();
      Donation.findByIdAndDelete = jest.fn().mockResolvedValue(mockDonation);

      await deleteDonation(req, res);

      expect(Donation.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439012');

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Donation deleted successfully',
        })
      );
    });

    test('should return 400 for invalid donation ID format', async () => {
      req.params.id = 'invalid';

      await deleteDonation(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid donation ID format',
        })
      );
    });

    test('should return 404 when donation not found', async () => {
      req.params.id = '507f1f77bcf86cd799439012';

      Donation.findByIdAndDelete = jest.fn().mockResolvedValue(null);

      await deleteDonation(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Donation not found',
        })
      );
    });

    test('should handle database deletion failure', async () => {
      req.params.id = '507f1f77bcf86cd799439012';

      Donation.findByIdAndDelete = jest.fn().mockRejectedValue(new Error('Database error'));

      await deleteDonation(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Error deleting donation',
        })
      );
    });
  });
});
