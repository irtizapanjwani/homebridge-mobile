/// <reference types="node" />
// Small helpers so every API response is JSON and never cached (it is one person's own data).

const HEADERS = { 'Cache-Control': 'no-store, private' };

export const ok = (body: Record<string, unknown> = {}) => Response.json({ ok: true, ...body }, { headers: HEADERS });
export const fail = (status: number, error: string, extra: Record<string, unknown> = {}) =>
  Response.json({ ok: false, error, ...extra }, { status, headers: HEADERS });

/** A small limit on wrong guesses per key, so a password cannot be tried thousands of times. */
const attempts = new Map<string, { count: number; until: number }>();
export function tooMany(key: string, max = 10, windowMs = 10 * 60_000) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.until < now) {
    attempts.set(key, { count: 1, until: now + windowMs });
    return false;
  }
  entry.count += 1;
  return entry.count > max;
}
export const clearAttempts = (key: string) => attempts.delete(key);
