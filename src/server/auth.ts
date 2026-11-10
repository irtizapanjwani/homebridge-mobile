/// <reference types="node" />
// Sign-in for the app's API. Copies the website's rules exactly (HomeBridge lib/member-auth.ts),
// so the same password works on both and the same session format is used:
//   passwords: scrypt$<salt hex>$<hash hex>
//   sessions:  "<reference>.<expires ms>.<HMAC-SHA256 base64url>" signed with MEMBER_SESSION_SECRET
// The app sends the session as "Authorization: Bearer <token>".

import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

import { getDb } from './db';
import type { MemberDoc } from './types';

const scrypt = promisify(scryptCb) as (p: string | Buffer, s: string | Buffer, k: number) => Promise<Buffer>;
const KEY_LENGTH = 64;
const SESSION_SECONDS = 60 * 60 * 24 * 30; // a month, same as the website
export const MIN_PASSWORD_LENGTH = 10;

export const isAuthConfigured = () => Boolean(process.env.MEMBER_SESSION_SECRET);

// ---------- Passwords ----------

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scrypt(password.normalize('NFKC'), salt, KEY_LENGTH);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, saltHex, hashHex] = stored.split('$');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = await scrypt(password.normalize('NFKC'), Buffer.from(saltHex, 'hex'), expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function passwordProblem(password: string): string | null {
  if (password.trim().length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters. A few words together is easiest to remember.`;
  }
  if (password.length > 200) return 'That password is too long.';
  return null;
}

// ---------- Session tokens ----------

function sign(payload: string) {
  const secret = process.env.MEMBER_SESSION_SECRET;
  if (!secret) throw new Error('MEMBER_SESSION_SECRET is not set');
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function makeToken(reference: string) {
  const expires = Date.now() + SESSION_SECONDS * 1000;
  const payload = `${reference}.${expires}`;
  return { token: `${payload}.${sign(payload)}`, expiresAt: new Date(expires).toISOString() };
}

function referenceFromToken(token: string): string | null {
  const at = token.lastIndexOf('.');
  if (at < 1) return null;
  const payload = token.slice(0, at);
  let expected: Buffer;
  try {
    expected = Buffer.from(sign(payload));
  } catch {
    return null;
  }
  const given = Buffer.from(token.slice(at + 1));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  const [reference, expiresRaw] = payload.split('.');
  const expires = Number(expiresRaw);
  if (!reference || !Number.isFinite(expires) || expires <= Date.now()) return null;
  return reference;
}

/** The signed-in member's reference from "Authorization: Bearer <token>", or null. */
export function signedInRef(req: Request): string | null {
  if (!isAuthConfigured()) return null;
  const m = /^Bearer\s+(\S+)$/i.exec(req.headers.get('authorization') ?? '');
  return m ? referenceFromToken(m[1]) : null;
}

// ---------- Finding members ----------

const normEmail = (v: string) => v.trim().toLowerCase();
/** Same as the website: digits only, last 10, so +234 810 583 2602 and 08105832602 match. */
export const normPhone = (v: string) => {
  const digits = v.replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
};

export async function members() {
  return (await getDb()).collection<MemberDoc>('members');
}

/** Email, membership number (HBC-…), application reference (HBA-…) or phone number. */
export async function findMemberByLogin(login: string): Promise<MemberDoc | null> {
  const value = login.trim();
  if (!value) return null;
  const col = await members();
  if (value.includes('@')) return col.findOne({ emailNorm: normEmail(value) }, { sort: { submittedAt: -1 } });
  const upper = value.toUpperCase();
  if (/^HBC-/.test(upper)) {
    return (await col.findOne({ 'membership.memberNo': upper })) ?? col.findOne({ reference: upper });
  }
  if (/^(HBA|APP|SUP|HB)-/.test(upper)) return col.findOne({ reference: upper });
  const phone = normPhone(value);
  if (phone.length >= 7) return col.findOne({ phoneNorm: phone }, { sort: { submittedAt: -1 } });
  return null;
}

export async function findMemberByRef(reference: string) {
  return (await members()).findOne({ reference });
}
