/**
 * PostgreSQL Test Database Setup
 * Provides utilities for setting up and tearing down test databases
 */

import pg from 'pg';
const { Pool } = pg;

let testPool;

/**
 * Initialize PostgreSQL test database connection
 */
export const setupTestDB = async () => {
  try {
    testPool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: String(process.env.DB_PASSWORD),
      database: process.env.DB_NAME,
    });

    // Test connection
    await testPool.query('SELECT NOW()');
    console.log('PostgreSQL test database connected');
    return testPool;
  } catch (error) {
    console.error('PostgreSQL test connection error:', error);
    throw error;
  }
};

/**
 * Clear all data from PostgreSQL test database
 */
export const clearTestDB = async () => {
  try {
    // Clear all tables in reverse order of dependencies
    await testPool.query('TRUNCATE TABLE pet_traits CASCADE');
    await testPool.query('TRUNCATE TABLE pet_photos CASCADE');
    await testPool.query('TRUNCATE TABLE traits CASCADE');
    await testPool.query('TRUNCATE TABLE pets CASCADE');
    console.log('PostgreSQL test database cleared');
  } catch (error) {
    console.error('Error clearing PostgreSQL test database:', error);
    throw error;
  }
};

/**
 * Close PostgreSQL test database connection
 */
export const teardownTestDB = async () => {
  try {
    if (testPool) {
      await testPool.end();
      console.log('PostgreSQL test database connection closed');
    }
  } catch (error) {
    console.error('Error closing PostgreSQL test connection:', error);
    throw error;
  }
};

/**
 * Get test pool instance
 */
export const getTestPool = () => testPool;

/**
 * Execute a query on the test database
 */
export const query = async (text, params) => {
  return testPool.query(text, params);
};
