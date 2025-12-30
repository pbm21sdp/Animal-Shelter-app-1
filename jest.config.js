export default {
  // Use Node environment for backend tests
  testEnvironment: 'node',

  // Support ES modules
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  // Test file patterns
  testMatch: [
    '**/backend/src/**/__tests__/**/*.test.js',
    '**/backend/src/**/*.test.js'
  ],

  // Coverage settings
  collectCoverageFrom: [
    'backend/src/**/*.js',
    '!backend/src/**/__tests__/**',
    '!backend/src/**/__mocks__/**',
    '!backend/src/app.js', // Main entry point, tested via integration tests
  ],

  coverageDirectory: 'backend/coverage',

  coverageThreshold: {
    global: {
      statements: 70,
      branches: 60,
      functions: 70,
      lines: 70
    }
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/backend/src/__tests__/setup.js'],

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Verbose output
  verbose: true,

  // Test timeout
  testTimeout: 10000,

  // Transform settings for ES modules
  transform: {},

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/frontend/'
  ],

  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/frontend/'
  ]
};
