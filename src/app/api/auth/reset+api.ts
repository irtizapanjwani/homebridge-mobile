/// <reference types="node" />
import { isAuthConfigured, makeToken, passwordProblem } from '@/server/auth';
import { isDbConfigured } from '@/server/db';
import { fail, ok, tooMany } from '@/server/http';
import { finishReset } from '@/server/reset';

/**
 * POST /api/auth/reset { login, code, password, passwordConfirm } → { token, expiresAt }
 * Signed in straight away, like on the website.
 */
export async function POST(req: Request) {
  if (!isAuthConfigured() || !isDbConfigured()) return fail(503, 'Sign-in is not configured');
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return fail(400, 'Invalid request');
  const login = typeof b.login === 'string' ? b.login.trim() : '';
  const code = typeof b.code === 'string' ? b.code.trim() : '';
  const password = typeof b.password === 'string' ? b.password : '';
  const confirm = typeof b.passwordConfirm === 'string' ? b.passwordConfirm : '';
  if (!login || !/^\d{6}$/.test(code)) return fail(422, 'Enter the 6-digit code from your email.');
  const problem = passwordProblem(password);
  if (problem) return fail(422, problem);
  if (password !== confirm) return fail(422, 'Both passwords must match.');
  if (tooMany(`reset:${login.toLowerCase()}`, 10, 15 * 60_000)) return fail(429, 'Too many tries. Please wait a few minutes.');
  try {
    const r = await finishReset(login, code, password);
    if (!r.ok) return fail(400, r.error);
    return ok(makeToken(r.reference));
  } catch (err) {
    console.error('[api/reset] failed:', err instanceof Error ? err.message : 'unknown error');
    return fail(502, 'Could not set your password. Please try again.');
  }
}
