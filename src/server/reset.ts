/// <reference types="node" />
// Forgot / reset password from the app. The website emails a long link; the app emails a 6-digit
// code instead, because typing a link into an app is awkward. Both use the same "passwordReset"
// field on the member (only a hash is stored, one use, a new request replaces the old one), so a
// member can't have a website link and an app code live at the same time.
// A code is good for 15 minutes and 5 tries.

import { createHash, randomInt, timingSafeEqual } from 'node:crypto';

import { findMemberByLogin, hashPassword, members } from './auth';
import { sendEmail } from './email';

export const CODE_TTL_MS = 15 * 60_000;
const MAX_TRIES = 5;
const hashOf = (reference: string, code: string) => createHash('sha256').update(`app-reset:${reference}:${code}`).digest('hex');

/** Emails a code if the login belongs to an account that can sign in. Says nothing either way. */
export async function startReset(login: string) {
  const m = await findMemberByLogin(login);
  // Same rule as the website: an account with a password, or an admitted member setting their first one.
  if (!m || !(m.passwordHash || m.membership) || !m.email?.trim()) return;
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  await (await members()).updateOne(
    { reference: m.reference },
    { $set: { passwordReset: { tokenHash: hashOf(m.reference, code), expiresAt: new Date(Date.now() + CODE_TTL_MS), requestedAt: new Date(), attempts: 0 } } },
  );
  const first = m.fullName.trim().split(/\s+/)[0] ?? '';
  const sent = await sendEmail(
    m.email,
    `Your HomeBridge code: ${code}`,
    `Hello ${first || 'there'},\n\nYour code to reset your HomeBridge password is:\n\n${code}\n\nType it in the HomeBridge app within 15 minutes. If you didn't ask for this, you can ignore this email — your password hasn't changed.\n\nHomeBridge Cooperative`,
  );
  if (!sent.ok) console.error('[reset] code email not sent:', sent.error);
}

/** Checks the code and sets the new password. Returns the member's reference, or an error to show. */
export async function finishReset(login: string, code: string, password: string): Promise<{ ok: true; reference: string } | { ok: false; error: string }> {
  const expired = { ok: false as const, error: 'That code has expired or has been used. Please ask for a new one.' };
  const m = await findMemberByLogin(login);
  const pr = m?.passwordReset;
  if (!m || !pr || pr.expiresAt.getTime() <= Date.now()) return expired;
  const col = await members();
  const given = Buffer.from(hashOf(m.reference, code), 'hex');
  const stored = Buffer.from(pr.tokenHash, 'hex');
  if (stored.length !== given.length || !timingSafeEqual(stored, given)) {
    const tries = (pr.attempts ?? 0) + 1;
    if (tries >= MAX_TRIES) {
      await col.updateOne({ reference: m.reference }, { $unset: { passwordReset: '' } });
      return { ok: false, error: 'Too many wrong codes. Please ask for a new one.' };
    }
    await col.updateOne({ reference: m.reference }, { $set: { 'passwordReset.attempts': tries } });
    return { ok: false, error: `That code isn’t right. ${MAX_TRIES - tries} ${MAX_TRIES - tries === 1 ? 'try' : 'tries'} left.` };
  }
  // Sets the password and retires the code together, so it can't be used twice.
  const res = await col.updateOne(
    { reference: m.reference, 'passwordReset.tokenHash': pr.tokenHash },
    { $set: { passwordHash: await hashPassword(password), updatedAt: new Date() }, $unset: { passwordReset: '' } },
  );
  return res.matchedCount === 1 ? { ok: true, reference: m.reference } : expired;
}
