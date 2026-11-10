/// <reference types="node" />
import { findMemberByRef, isAuthConfigured, signedInRef } from '@/server/auth';
import { isDbConfigured } from '@/server/db';
import { fail, ok } from '@/server/http';
import { buildMe } from '@/server/me';

/**
 * GET /api/me  (Authorization: Bearer <token>)  →  { ok, me }
 * The signed-in person's own record: application progress, documents, joining fee, details,
 * nominees, and for members their membership and contributions. Feeds Home and My account.
 */
export async function GET(req: Request) {
  if (!isAuthConfigured() || !isDbConfigured()) return fail(503, 'Sign-in is not configured');
  const ref = signedInRef(req);
  if (!ref) return fail(401, 'Please sign in');
  try {
    const member = await findMemberByRef(ref);
    if (!member) return fail(401, 'Please sign in');
    return ok({ me: await buildMe(member) });
  } catch (err) {
    console.error('[api/me] failed:', err instanceof Error ? err.message : 'unknown error');
    return fail(502, 'Could not load your account just now');
  }
}
