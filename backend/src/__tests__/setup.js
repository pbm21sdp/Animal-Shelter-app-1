/**
 * Jest test setup file
 * Runs before all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_EXPIRES_IN = '1h';

// PostgreSQL test database
process.env.DB_HOST = process.env.TEST_DB_HOST || 'localhost';
process.env.DB_PORT = process.env.TEST_DB_PORT || '5432';
process.env.DB_USER = process.env.TEST_DB_USER || 'postgres';
process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD || 'postgres';
process.env.DB_NAME = process.env.TEST_DB_NAME || 'paws_test';

// MongoDB test database
process.env.MONGO_URI = process.env.TEST_MONGO_URI || 'mongodb://localhost:27017/paws_test';

// Disable external services in tests
process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key_for_testing';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_fake_webhook_secret_for_testing';
process.env.MAILTRAP_TOKEN = 'fake_mailtrap_token_for_testing';

// ML service
process.env.ML_SERVICE_URL = process.env.TEST_ML_SERVICE_URL || 'http://localhost:5001';

// Set test timeout (handled in jest.config.js instead)
// jest.setTimeout(10000); // 10 seconds

// Suppress console logs during tests (uncomment to enable)
global.console = {
  ...console,
  // log: () => {},     // Keep regular logs visible
  // debug: () => {},
  // info: () => {},
  // warn: () => {},
  error: () => {},      // Suppress error logs from intentional test failures
};

console.log('Test environment initialized');
