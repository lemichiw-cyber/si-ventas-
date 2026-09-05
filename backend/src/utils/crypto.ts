import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const ALGORITHM = 'aes-256-gcm'; // GCM adds authenticated encryption
const IV_LENGTH = 16;   // 12 bytes recommended for GCM but 16 works
const AUTH_TAG_LENGTH = 16;
const DEFAULT_KEY = '0123456789abcdef0123456789abcdef';

/**
 * Resolve the encryption key from env, supporting key rotation.
 * Supports:
 *   - AES_KEY (current key, 32 bytes)
 *   - AES_KEY_PREVIOUS (old key, 32 bytes) — needed to decrypt data encrypted before rotation
 *
 * The key is normalized to exactly 32 bytes (UTF-8, hex, or SHA-256 hash).
 */
function normalizeKey(raw: string): Buffer {
  const trimmed = raw.trim();
  if (trimmed.length === 32) return Buffer.from(trimmed, 'utf8');
  if (trimmed.length === 64) return Buffer.from(trimmed, 'hex');
  return crypto.createHash('sha256').update(trimmed).digest();
}

export const KEY: Buffer = normalizeKey(process.env.AES_KEY || DEFAULT_KEY);
export const PREVIOUS_KEY: Buffer | null = process.env.AES_KEY_PREVIOUS
  ? normalizeKey(process.env.AES_KEY_PREVIOUS)
  : null;

/**
 * Encrypt text using AES-256-GCM with a random IV per call.
 * Returns: iv:authTag:ciphertext (all hex) — format is self-describing.
 * The auth tag ensures ciphertext integrity (detects tampering).
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypt text that was encrypted with AES-256-GCM.
 * Tries the current key first, then falls back to the previous key (rotation support).
 * Falls back to returning plaintext if the value is not in the encrypted format.
 */
export function decrypt(text: string): string {
  const parts = text.split(':');
  if (parts.length !== 3) return text; // not encrypted (legacy or plaintext)

  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');

  // Try current key, then previous key
  for (const candidateKey of [KEY, PREVIOUS_KEY].filter(Boolean) as Buffer[]) {
    try {
      const decipher = crypto.createDecipheriv(ALGORITHM, candidateKey, iv);
      decipher.setAuthTag(authTag);
      const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
      return decrypted.toString('utf8');
    } catch {
      continue; // try next key
    }
  }

  return text; // all keys failed — return as-is
}

export async function hashPassword(password: string): Promise<string> {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
  return bcrypt.hash(password, rounds);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// sanitize basic XSS
export function sanitizeInput(input: string): string {
  return input.replace(/[<>\"'`;]/g, '').trim();
}

// Export verifyPassword as alias for comparePassword for compatibility
export const verifyPassword = comparePassword;
