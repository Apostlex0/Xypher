/**
 * Encryption utilities for privacy-preserving order storage
 * Uses AES-256-GCM for encryption and SHA-256 for hashing
 */

import crypto from 'crypto';

// Encryption key from environment (32 bytes for AES-256)
const ENCRYPTION_KEY = process.env.DB_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const SALT_SECRET = process.env.SALT_SECRET || 'zec-dark-perps-salt-secret';

// Ensure key is 32 bytes
const KEY_BUFFER = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');

/**
 * Hash user public key for privacy
 * Same user always gets same hash (deterministic)
 */
export function hashUserPubkey(pubkey: string): string {
  return crypto
    .createHash('sha256')
    .update(pubkey + SALT_SECRET)
    .digest('hex');
}

/**
 * Get size bucket for privacy
 * Buckets: 0-1, 1-10, 10-100, 100+
 */
export function getSizeBucket(size: number): string {
  if (size < 1) return '0-1';
  if (size < 10) return '1-10';
  if (size < 100) return '10-100';
  return '100+';
}

/**
 * Round price to nearest level for privacy
 * Rounds to nearest $1
 */
export function getPriceLevel(price: number): number {
  return Math.round(price);
}

/**
 * Encrypt sensitive data using AES-256-GCM
 */
export function encrypt(data: any): string {
  try {
    // Generate random IV (12 bytes for GCM)
    const iv = crypto.randomBytes(12);
    
    // Create cipher
    const cipher = crypto.createCipheriv('aes-256-gcm', KEY_BUFFER, iv);
    
    // Encrypt data
    const jsonData = JSON.stringify(data);
    let encrypted = cipher.update(jsonData, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get auth tag
    const authTag = cipher.getAuthTag();
    
    // Combine IV + authTag + encrypted data
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data encrypted with encrypt()
 */
export function decrypt(encryptedData: string): any {
  try {
    // Split IV, authTag, and encrypted data
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', KEY_BUFFER, iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Encrypt order details for storage
 */
export interface OrderDetails {
  userPubkey: string;
  exactSize: number;
  exactPrice: number;
}

export function encryptOrderDetails(details: OrderDetails): string {
  return encrypt(details);
}

export function decryptOrderDetails(encrypted: string): OrderDetails {
  return decrypt(encrypted);
}

/**
 * Encrypt trade details for storage
 */
export interface TradeDetails {
  buyerPubkey: string;
  sellerPubkey: string;
  exactSize: number;
}

export function encryptTradeDetails(details: TradeDetails): string {
  return encrypt(details);
}

export function decryptTradeDetails(encrypted: string): TradeDetails {
  return decrypt(encrypted);
}

/**
 * Encrypt position details for storage
 */
export interface PositionDetails {
  userPubkey: string;
  size: number;
  entryPrice: number;
  leverage: number;
  currentPnL: number;
}

export function encryptPositionDetails(details: PositionDetails): string {
  return encrypt(details);
}

export function decryptPositionDetails(encrypted: string): PositionDetails {
  return decrypt(encrypted);
}

/**
 * Generate encryption key (for initial setup)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}
