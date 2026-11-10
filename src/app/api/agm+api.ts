/// <reference types="node" />
import { findMemberByRef, signedInRef } from '@/server/auth';
import { replyToAgm } from '@/server/community';
import { isDbConfigured } from '@/server/db';
import { fail, ok } from '@/server/http';

/** POST /api/agm { answer: "yes" | "no" } — will the member attend the next meeting. */
export async function POST(req: Request) {
  if (!isDbConfigured()) return fail(503, 'Not available just now');
  const ref = signedInRef(req);
  if (!ref) return fail(401, 'Please sign in again');
  const body = (await req.json().catch(() => ({}))) as { answer?: unknown };
  if (body.answer !== 'yes' && body.answer !== 'no') return fail(400, 'Invalid answer');
  try {
    const m = await findMemberByRef(ref);
    if (!m) return fail(401, 'Please sign in again');
    const r = await replyToAgm(m, body.answer);
    return r.ok ? ok() : fail(409, r.error);
  } catch (err) {
    console.error('[api/agm] failed:', err instanceof Error ? err.message : 'unknown error');
    return fail(502, 'Your reply could not be saved. Please try again.');
  }
}
