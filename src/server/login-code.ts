/// <reference types="node" />
// Sign in with a one-time code sent by email. An exact copy of the website's rules
// (HomeBridge lib/member-otp.ts): six digits, 10 minutes, one use, five wrong tries wipe it, only an
// HMAC stored (keyed with MEMBER_SESSION_SECRET) in the same "loginCode" field — so a code asked for
// on the website also works in the app, and the other way round.

import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';

import { members } from './auth';
import { sendEmail } from './email';

const CODE_MINUTES = 10;
const MAX_TRIES = 5;

const hashCode = (reference: string, code: string) =>
  createHmac('sha256', process.env.MEMBER_SESSION_SECRET ?? '').update(`${reference}:${code}`).digest('hex');

/** Same lookup as the website's findMemberByEmail: the newest record with that email. */
async function byEmail(email: string) {
  return (await members()).findOne({ emailNorm: email.trim().toLowerCase() }, { sort: { submittedAt: -1 } });
}

/** Emails a fresh code if the address belongs to an account. Says nothing either way. */
export async function requestLoginCode(email: string) {
  const m = await byEmail(email);
  if (!m?.email) return;
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  await (await members()).updateOne(
    { reference: m.reference },
    { $set: { loginCode: { hash: hashCode(m.reference, code), expiresAt: new Date(Date.now() + CODE_MINUTES * 60_000), attempts: 0 } } },
  );
  const name = m.firstName?.trim() || m.fullName.trim().split(/\s+/)[0] || 'there';
  const sent = await sendEmail(
    m.email,
    `Your HomeBridge sign-in code: ${code}`,
    [
      `Hello ${name},`,
      '',
      `Your HomeBridge sign-in code is: ${code}`,
      '',
      `Enter it on the sign-in page within ${CODE_MINUTES} minutes. It works once.`,
      '',
      'If you did not ask to sign in, you can ignore this email. Nobody can use the code unless they can read this inbox.',
      '',
      'HomeBridge Cooperative',
    ].join('\n'),
  );
  if (!sent.ok) console.error('[login-code] code email not sent:', sent.error);
}

/** Checks a code. Returns the member's reference when it is right, null otherwise. */
export async function verifyLoginCode(email: string, code: string): Promise<string | null> {
  if (!/^\d{6}$/.test(code)) return null;
  const m = await byEmail(email);
  const lc = m?.loginCode;
  if (!m || !lc) return null;
  const col = await members();
  if (lc.expiresAt.getTime() < Date.now() || lc.attempts >= MAX_TRIES) {
    await col.updateOne({ reference: m.reference }, { $unset: { loginCode: '' } });
    return null;
  }
  const expected = Buffer.from(lc.hash, 'hex');
  const given = Buffer.from(hashCode(m.reference, code), 'hex');
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    await col.updateOne({ reference: m.reference }, { $inc: { 'loginCode.attempts': 1 } });
    return null;
  }
  // Used once: wiped before the session is made.
  await col.updateOne({ reference: m.reference }, { $unset: { loginCode: '' } });
  return m.reference;
}
