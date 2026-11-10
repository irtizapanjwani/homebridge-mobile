/// <reference types="node" />
import { findMemberByRef, signedInRef } from '@/server/auth';
import { castVote, isChoice } from '@/server/community';
import { isDbConfigured } from '@/server/db';
import { fail, ok } from '@/server/http';

/** POST /api/vote { motionId, choice: "For" | "Against" | "Abstain" } — one member, one vote. */
export async function POST(req: Request) {
  if (!isDbConfigured()) return fail(503, 'Not available just now');
  const ref = signedInRef(req);
  if (!ref) return fail(401, 'Please sign in again');
  const body = (await req.json().catch(() => ({}))) as { motionId?: unknown; choice?: unknown };
  if (typeof body.motionId !== 'string' || !isChoice(body.choice)) return fail(400, 'Invalid vote');
  try {
    const m = await findMemberByRef(ref);
    if (!m) return fail(401, 'Please sign in again');
    const r = await castVote(m, body.motionId, body.choice);
    return r.ok ? ok() : fail(r.status, r.error);
  } catch (err) {
    console.error('[api/vote] failed:', err instanceof Error ? err.message : 'unknown error');
    return fail(502, 'Your vote could not be saved. Please try again.');
  }
}
