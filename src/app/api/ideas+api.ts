/// <reference types="node" />
import { findMemberByRef, signedInRef } from '@/server/auth';
import { sendIdea } from '@/server/community';
import { isDbConfigured } from '@/server/db';
import { fail, ok } from '@/server/http';

/** POST /api/ideas { text } — a member shares an idea with the board. */
export async function POST(req: Request) {
  if (!isDbConfigured()) return fail(503, 'Not available just now');
  const ref = signedInRef(req);
  if (!ref) return fail(401, 'Please sign in again');
  const body = (await req.json().catch(() => ({}))) as { text?: unknown };
  if (typeof body.text !== 'string') return fail(400, 'Invalid request');
  try {
    const m = await findMemberByRef(ref);
    if (!m) return fail(401, 'Please sign in again');
    const r = await sendIdea(m, body.text);
    return r.ok ? ok() : fail(422, r.error);
  } catch (err) {
    console.error('[api/ideas] failed:', err instanceof Error ? err.message : 'unknown error');
    return fail(502, 'Your idea could not be sent. Please try again.');
  }
}
