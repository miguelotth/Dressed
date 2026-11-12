import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(scryptCallback);
const opts = { N: 16384, r: 8, p: 1, maxmem: 32 * 1024 * 1024 };
export const cookieName = 'lookloop_session';
export const sessionMs = 7 * 24 * 60 * 60 * 1000;
export function cookieOptions(secure = false) {
  return { httpOnly: true, secure, sameSite: 'lax' as const, path: '/', maxAge: sessionMs };
}
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const digest = await scrypt(password, salt, 64, opts) as Buffer;
  return `scrypt$${opts.N}$${opts.r}$${opts.p}$${salt.toString('hex')}$${digest.toString('hex')}`;
}
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt' || parts[1] !== String(opts.N) || parts[2] !== String(opts.r) || parts[3] !== String(opts.p) || !/^[a-f0-9]{32}$/.test(parts[4] ?? '') || !/^[a-f0-9]{128}$/.test(parts[5] ?? '')) return false;
  const digest = await scrypt(password, Buffer.from(parts[4]!, 'hex'), 64, opts) as Buffer;
  return timingSafeEqual(digest, Buffer.from(parts[5]!, 'hex'));
}
export const newToken = (): string => randomBytes(32).toString('hex');
export const tokenHash = (token: string): string => createHash('sha256').update(token).digest('hex');
export function readToken(rawCookie?: string): string | null {
  const val = rawCookie?.split(';').map(v => v.trim()).find(v => v.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
  return val && /^[a-f0-9]{64}$/.test(val) ? val : null;
}
