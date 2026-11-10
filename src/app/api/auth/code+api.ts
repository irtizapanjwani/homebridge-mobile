/// <reference types="node" />
import { isAuthConfigured } from '@/server/auth';
import { isDbConfigured } from '@/server/db';
import { isEmailConfigured } from '@/server/email';
import { fail, ok, tooMany } from '@/server/http';
import { requestLoginCode } from '@/server/login-code';

/**
 * POST /api/auth/code { email } — emails a 6-digit sign-in code (no password needed).
 * Always answers the same way, whether or not the address has an account.
 */
export async function POST(req: Request) {
  if (!isAuthConfigured() || !isDbConfigured() || !isEmailConfigured()) {
    return fail(503, 'Sign-in by code is not available just now. Use your password.');
  }
  const b = (await req.json().catch(() => null)) as { email?: unknown } | null;
  const email = typeof b?.email === 'string' ? b.email.trim() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(422, 'Enter the email address you registered with.');
  if (tooMany(`code:${email.toLowerCase()}`, 5, 15 * 60_000)) return fail(429, 'Too many codes requested. Please wait a few minutes.');
  try {
    await requestLoginCode(email);
  } catch (err) {
    console.error('[api/code] could not issue a code:', err instanceof Error ? err.message : 'unknown error');
  }
  return ok();
}
