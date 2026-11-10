/// <reference types="node" />
import { findMemberByLogin, isAuthConfigured, makeToken, verifyPassword } from '@/server/auth';
import { isDbConfigured } from '@/server/db';
import { clearAttempts, fail, ok, tooMany } from '@/server/http';

/**
 * POST /api/auth/login  { login, password }  →  { ok, token, expiresAt }
 * "login" is an email, membership number (HBC-…), application reference (HBA-…) or phone.
 * Same accounts and passwords as the website.
 */
export async function POST(req: Request) {
  if (!isAuthConfigured() || !isDbConfigured()) return fail(503, 'Sign-in is not configured');

  let login = '';
  let password = '';
  try {
    const body = (await req.json()) as { login?: unknown; password?: unknown };
    login = typeof body.login === 'string' ? body.login.trim() : '';
    password = typeof body.password === 'string' ? body.password : '';
  } catch {
    return fail(400, 'Invalid request');
  }
  if (!login || !password) return fail(400, 'Enter your email, membership number or phone, and your password');

  const key = login.toLowerCase();
  if (tooMany(key)) return fail(429, 'Too many attempts. Try again in a few minutes.');

  try {
    const member = await findMemberByLogin(login);
    // The same answer whether the account is unknown or the password is wrong, so sign-in can't
    // be used to find out who has registered.
    const good = member?.passwordHash ? await verifyPassword(password, member.passwordHash) : false;
    if (!good || !member) return fail(401, 'Those details don’t match an account.');
    clearAttempts(key);
    return ok(makeToken(member.reference));
  } catch (err) {
    console.error('[api/login] failed:', err instanceof Error ? err.message : 'unknown error');
    return fail(502, 'Could not sign you in just now');
  }
}
