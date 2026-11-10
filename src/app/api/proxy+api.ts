/// <reference types="node" />
import { findMemberByRef, signedInRef } from '@/server/auth';
import { cancelProxy, giveProxy } from '@/server/community';
import { isDbConfigured } from '@/server/db';
import { fail, ok } from '@/server/http';

/** POST /api/proxy { motionId, holderNo } gives your proxy; { motionId, cancel: true } takes it back. */
export async function POST(req: Request) {
  if (!isDbConfigured()) return fail(503, 'Not available just now');
  const ref = signedInRef(req);
  if (!ref) return fail(401, 'Please sign in again');
  const b = (await req.json().catch(() => null)) as { motionId?: unknown; holderNo?: unknown; cancel?: unknown } | null;
  if (!b || typeof b.motionId !== 'string') return fail(400, 'Invalid request');
  try {
    const m = await findMemberByRef(ref);
    if (!m) return fail(401, 'Please sign in again');
    const r = b.cancel === true ? await cancelProxy(m, b.motionId) : await giveProxy(m, b.motionId, typeof b.holderNo === 'string' ? b.holderNo : '');
    return r.ok ? ok() : fail(422, r.error);
  } catch (err) {
    console.error('[api/proxy] failed:', err instanceof Error ? err.message : 'unknown error');
    return fail(502, 'That did not work. Please try again.');
  }
}
