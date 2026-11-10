/// <reference types="node" />
import {
  ageOn,
  countryName,
  draftToMember,
  firstProblem,
  issueApplicationRef,
  livesInNigeria,
  makeReference,
  toDraft,
  TYPE_LABEL,
  upsertPerson,
} from '@/server/apply';
import { recordAudit } from '@/server/audit';
import { hashPassword, isAuthConfigured, makeToken, members, passwordProblem } from '@/server/auth';
import { isDbConfigured } from '@/server/db';
import { isEmailConfigured, sendApplicationConfirmation, sendOfficeAlert } from '@/server/email';
import { fail, ok, tooMany } from '@/server/http';

/**
 * POST /api/apply  — the registration "Send application" button.
 * Body: the same fields as the website's /api/apply. Returns { reference, status, token, expiresAt }
 * so the app is signed in straight away (the website does the same with a cookie). The ID photo and
 * proof of address are sent afterwards to /api/documents with that token.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    const parsed = await req.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object');
    body = parsed as Record<string, unknown>;
  } catch {
    return fail(400, 'Invalid request');
  }

  const draft = toDraft(body);
  const today = new Date();
  const problem = firstProblem(draft, today);
  if (problem) {
    return fail(422, Object.values(problem.errors)[0] ?? 'Some answers need checking', { step: problem.step, fields: Object.keys(problem.errors) });
  }
  if (!(ageOn(draft.dob, today) >= 18)) return fail(422, 'Applicants must be 18 or older', { step: 'about' });
  const badPassword = passwordProblem(draft.password);
  if (badPassword) return fail(422, badPassword, { step: 'account', fields: ['password'] });

  if (!isAuthConfigured() || !isDbConfigured()) return fail(503, 'Registration is not configured');

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (tooMany(`apply:${ip}`, 10, 60 * 60_000)) return fail(429, 'Too many applications from here. Please try again later.');

  const supporter = draft.route === 'none';
  const email = draft.email || (draft.contactMethod === 'email' ? draft.contact : '');
  const phone = draft.whatsapp || (draft.contactMethod === 'phone' ? draft.contact : '');

  try {
    const personRef = await upsertPerson({ name: draft.fullName, email, phone });
    const reference = supporter ? makeReference('SUP') : await issueApplicationRef(today);
    const passwordHash = await hashPassword(draft.password);
    await (await members()).insertOne(draftToMember(draft, { reference, personRef, passwordHash }) as never);

    await recordAudit({
      action: 'application.submitted',
      actor: `Applicant (${draft.fullName})`,
      subject: reference,
      detail: `${supporter ? 'Supporter' : 'Application'} sent from the app`,
      after: 'Submitted',
    }).catch(() => {});

    // Same emails as the website. They never fail the application: the reference is on screen either way.
    if (isEmailConfigured()) {
      if (email) {
        const sent = await sendApplicationConfirmation({
          to: email,
          firstName: draft.fullName.split(/\s+/)[0] ?? '',
          reference,
          supporter,
          fee: supporter ? undefined : livesInNigeria(draft) ? '₦10,000' : '£10',
          paymentReference: draft.paymentReference,
          paidReported: Boolean(draft.datePaid || draft.paymentReference),
        });
        if (!sent.ok) console.error('[api/apply] confirmation email not sent:', sent.error);
      }
      const alert = await sendOfficeAlert({
        reference,
        fullName: draft.fullName,
        kind: supporter ? 'Supporter' : 'Application',
        email,
        phone,
        memberType: TYPE_LABEL[draft.memberType] ?? draft.memberType,
        country: countryName(draft),
        chapter: draft.chapter,
        paymentMethod: draft.paymentMethod,
      });
      if (!alert.ok) console.error('[api/apply] office alert not sent:', alert.error);
      // Kept so a later reply from this applicant lands in the same email conversation (as on the website).
      if (alert.thread && Object.keys(alert.thread.ids).length) {
        await (await members()).updateOne({ reference }, { $set: { officeAlert: alert.thread } }).catch(() => {});
      }
    }

    return ok({ reference, status: supporter ? 'Supporter' : 'Submitted', ...makeToken(reference) });
  } catch (err) {
    // Never let the error text out: a Mongo error can carry the connection string.
    console.error('[api/apply] could not store the application:', err instanceof Error ? err.message : 'unknown error');
    return fail(502, 'We could not send your application just now. Please try again.');
  }
}
