/// <reference types="node" />
import { isAuthConfigured } from '@/server/auth';
import { isDbConfigured } from '@/server/db';
import { isEmailConfigured } from '@/server/email';
import { fail, ok, tooMany } from '@/server/http';
import { startReset } from '@/server/reset';

/**
 * POST /api/auth/forgot { login }  — login is an email or phone number.
 * Always answers the same, so it can't be used to find out who has registered.
 */
export async function POST(req: Request) {
  if (!isAuthConfigured() || !isDbConfigured()) return fail(503, 'Sign-in is not configured');
  if (!isEmailConfigured()) return fail(503, 'We can’t send codes just now. Please message the office and we’ll help.');
  const b = (await req.json().catch(() => null)) as { login?: unknown } | null;
  const login = typeof b?.login === 'string' ? b.login.trim() : '';
  if (!login) return fail(422, 'Enter your email or phone number.');
  if (tooMany(`forgot:${login.toLowerCase()}`, 5, 15 * 60_000)) return fail(429, 'Too many requests. Please try again later.');
  try {
    await startReset(login);
  } catch (err) {
    console.error('[api/forgot] failed:', err instanceof Error ? err.message : 'unknown error');
  }
  return ok();
}
