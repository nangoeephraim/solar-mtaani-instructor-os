/**
 * PRISM Security Service
 * 
 * Provides cryptographic functions for the authentication system.
 * Uses Web Crypto API for secure, standard-compliant hashing.
 */

import { AuthUser } from '../types';

// Constants
const HASH_ALGO = 'SHA-256';
const SALT_LENGTH = 16; // bytes
const ITERATIONS = 100000; // PBKDF2 iterations (if we were using PBKDF2, but for PINs, salted SHA-256 is acceptable if salt is unique)

// Helper: Convert ArrayBuffer to Hex String
const bufferToHex = (buffer: ArrayBuffer): string => {
    return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
};

// Helper: Convert Hex String to Uint8Array
const hexToBytes = (hex: string): Uint8Array => {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
};

/**
 * Generates a random salt for password hashing.
 */
export const generateSalt = (): string => {
    const randomValues = new Uint8Array(SALT_LENGTH);
    window.crypto.getRandomValues(randomValues);
    return bufferToHex(randomValues.buffer);
};

/**
 * Hashes a PIN using SHA-256 with a unique salt.
 * @param pin The plain text PIN
 * @param salt The unique user salt (hex string)
 */
export const hashPin = async (pin: string, salt: string): Promise<string> => {
    const encoder = new TextEncoder();
    // Combine PIN and Salt
    const data = encoder.encode(pin + salt);
    const hashBuffer = await window.crypto.subtle.digest(HASH_ALGO, data);
    return bufferToHex(hashBuffer);
};

/**
 * Legacy "Security Theater" Hash Function
 * Used to validate existing users before migration.
 */
export const legacyHashPin = (pin: string): string => {
    let hash = 0;
    for (let i = 0; i < pin.length; i++) {
        const char = pin.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
};

/**
 * Validates a PIN against a user record.
 * Handles both new (Salted SHA-256) and legacy (Simple Hash) formats.
 * 
 * @returns Object containing:
 *  - isValid: boolean
 *  - requiresMigration: boolean (true if user authenticated with legacy method)
 */
export const validatePin = async (pin: string, user: AuthUser): Promise<{ isValid: boolean; requiresMigration: boolean }> => {
    // 1. Try New Secure Method (if user has a salt)
    if (user.salt) {
        const newHash = await hashPin(pin, user.salt);
        if (newHash === user.pin) {
            return { isValid: true, requiresMigration: false };
        }
        // If salt exists, we do NOT fall back to legacy. Once upgraded, always upgraded.
        return { isValid: false, requiresMigration: false };
    }

    // 2. Fallback to Legacy Method (no salt present)
    const legacyHash = legacyHashPin(pin);
    if (legacyHash === user.pin) {
        return { isValid: true, requiresMigration: true };
    }

    return { isValid: false, requiresMigration: false };
};
