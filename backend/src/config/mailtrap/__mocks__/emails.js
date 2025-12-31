/**
 * Mock for Mailtrap Email Functions
 * Used in auth controller tests
 */

import { jest } from '@jest/globals';

// Note: "sendVerficationEmail" is a typo in the original controller (not "Verification")
// We keep the typo here to match the actual import
export const sendVerficationEmail = jest.fn().mockResolvedValue(undefined);
export const sendWelcomeEmail = jest.fn().mockResolvedValue(undefined);
export const sendPasswordResetEmail = jest.fn().mockResolvedValue(undefined);
export const sendResetSuccessEmail = jest.fn().mockResolvedValue(undefined);
