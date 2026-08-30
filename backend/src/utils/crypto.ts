import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const ALGORITHM = 'aes-256-cbc';
const KEY = (() => {
  const envKey = process.env.AES_KEY || '0123456789abcdef0123456789abcdef';
  // Ensure 32 bytes
  if (envKey.length === 32) return Buffer.from(envKey);
  // if hex 64 chars
  if (envKey.length === 64) return Buffer.from(envKey, 'hex');
  return crypto.createHash('sha256').update(envKey).digest();
})();
const IV_LENGTH = 16;

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decrypt(text: string): string {
  try {
    const [ivHex, encrypted] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return text; // fallback if not encrypted
  }
}

export async function hashPassword(password: string): Promise<string> {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
  return bcrypt.hash(password, rounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// sanitize basic XSS
export function sanitizeInput(input: string): string {
  return input.replace(/[<>"'`;]/g, '').trim();
}
