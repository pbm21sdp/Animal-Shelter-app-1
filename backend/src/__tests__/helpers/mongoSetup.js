/**
 * MongoDB Test Database Setup
 * Provides utilities for setting up and tearing down test MongoDB databases
 */

import mongoose from 'mongoose';

/**
 * Initialize MongoDB test database connection
 */
export const setupTestMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB test database connected');
  } catch (error) {
    console.error('MongoDB test connection error:', error);
    throw error;
  }
};

/**
 * Clear all data from MongoDB test database
 */
export const clearTestMongoDB = async () => {
  try {
    const collections = mongoose.connection.collections;

    // Clear all collections
    for (const key in collections) {
      await collections[key].deleteMany({});
    }

    console.log('MongoDB test database cleared');
  } catch (error) {
    console.error('Error clearing MongoDB test database:', error);
    throw error;
  }
};

/**
 * Close MongoDB test database connection
 */
export const teardownTestMongoDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB test database connection closed');
  } catch (error) {
    console.error('Error closing MongoDB test connection:', error);
    throw error;
  }
};

/**
 * Get MongoDB connection instance
 */
export const getMongoConnection = () => mongoose.connection;
