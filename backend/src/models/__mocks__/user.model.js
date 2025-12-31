/**
 * Mock for User Model
 * Extended for auth controller tests with constructor pattern
 */

import { jest } from '@jest/globals';

// User constructor mock (for `new User()` pattern)
export const User = jest.fn((userData) => {
  const instance = {
    _id: userData._id || '507f1f77bcf86cd799439011',
    email: userData.email || '',
    password: userData.password || '',
    name: userData.name || '',
    avatar: userData.avatar || null,
    lastLogin: userData.lastLogin || new Date(),
    isVerified: userData.isVerified !== undefined ? userData.isVerified : false,
    isAdmin: userData.isAdmin !== undefined ? userData.isAdmin : false,
    verificationToken: userData.verificationToken,
    verificationTokenExpiresAt: userData.verificationTokenExpiresAt,
    resetPasswordToken: userData.resetPasswordToken,
    resetPasswordExpiresAt: userData.resetPasswordExpiresAt,
    createdAt: userData.createdAt || new Date(),
    updatedAt: userData.updatedAt || new Date(),
    _doc: {},
    save: jest.fn().mockResolvedValue(null),
  };

  // Populate _doc with all instance data (mimics Mongoose behavior)
  instance._doc = { ...instance };
  instance.save.mockResolvedValue(instance);

  return instance;
});

// Static methods
User.findById = jest.fn();
User.find = jest.fn();
User.findOne = jest.fn();

// Helper factory for creating mock users
export const createMockUser = (overrides = {}) => {
  const user = {
    _id: overrides._id || '507f1f77bcf86cd799439011',
    email: overrides.email || 'test@example.com',
    password: overrides.password || 'hashedPassword123',
    name: overrides.name || 'Test User',
    avatar: overrides.avatar || null,
    lastLogin: overrides.lastLogin || new Date(),
    isVerified: overrides.isVerified !== undefined ? overrides.isVerified : false,
    isAdmin: overrides.isAdmin !== undefined ? overrides.isAdmin : false,
    verificationToken: overrides.verificationToken,
    verificationTokenExpiresAt: overrides.verificationTokenExpiresAt,
    resetPasswordToken: overrides.resetPasswordToken,
    resetPasswordExpiresAt: overrides.resetPasswordExpiresAt,
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
    _doc: {},
    save: jest.fn().mockResolvedValue(null),
  };

  // Populate _doc
  user._doc = { ...user };
  user.save.mockResolvedValue(user);

  return user;
};
