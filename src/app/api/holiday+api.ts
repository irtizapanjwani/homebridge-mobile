/// <reference types="node" />
import { findMemberByRef, signedInRef } from '@/server/auth';
import { isDbConfigured } from '@/server/db';
import { fail, ok } from '@/server/http';
import { requestHoliday } from '@/server/payments';

/** POST /api/holiday { from: "YYYY-MM", to: "YYYY-MM", reason } — ask the Treasurer for a payment holiday. */
export async function POST(req: Request) {
  if (!isDbConfigured()) return fail(503, 'Not available just now');
  const ref = signedInRef(req);
  if (!ref) return fail(401, 'Please sign in again');
  const b = (await req.json().catch(() => null)) as { from?: unknown; to?: unknown; reason?: unknown } | null;
  if (!b) return fail(400, 'Invalid request');
  const str = (v: unknown) => (typeof v === 'string' ? v : '');
  try {
    const m = await findMemberByRef(ref);
    if (!m) return fail(401, 'Please sign in again');
    const r = await requestHoliday(m, str(b.from), str(b.to), str(b.reason));
    return r.ok ? ok() : fail(422, r.error);
  } catch (err) {
    console.error('[api/holiday] failed:', err instanceof Error ? err.message : 'unknown error');
    return fail(502, 'We could not send that. Please try again.');
  }
}
