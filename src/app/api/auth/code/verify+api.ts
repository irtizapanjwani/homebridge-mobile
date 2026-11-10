/// <reference types="node" />
import { isAuthConfigured, makeToken } from '@/server/auth';
import { isDbConfigured } from '@/server/db';
import { fail, ok, tooMany } from '@/server/http';
import { verifyLoginCode } from '@/server/login-code';

/** POST /api/auth/code/verify { email, code } → { token, expiresAt } — signs in with the emailed code. */
export async function POST(req: Request) {
  if (!isAuthConfigured() || !isDbConfigured()) return fail(503, 'Sign-in is not configured');
  const b = (await req.json().catch(() => null)) as { email?: unknown; code?: unknown } | null;
  if (!b) return fail(400, 'Invalid request');
  const email = typeof b.email === 'string' ? b.email.trim() : '';
  const code = typeof b.code === 'string' ? b.code.replace(/\s/g, '') : '';
  if (tooMany(`verify:${email.toLowerCase()}`, 10, 15 * 60_000)) return fail(429, 'Too many attempts. Ask for a new code in a few minutes.');
  try {
    const reference = await verifyLoginCode(email, code);
    if (!reference) return fail(401, 'That code is not right or has expired. Ask for a new one.');
    return ok(makeToken(reference));
  } catch (err) {
    console.error('[api/code/verify] failed:', err instanceof Error ? err.message : 'unknown error');
    return fail(502, 'Could not sign you in just now');
  }
}
