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
import { emailOffice, isEmailConfigured, sendEmail } from '@/server/email';
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

    // Emails never fail the application: the reference is on screen either way.
    if (isEmailConfigured()) {
      const first = draft.fullName.split(/\s+/)[0] ?? '';
      const fee = livesInNigeria(draft) ? '₦10,000' : '£10';
      const paid = Boolean(draft.datePaid || draft.paymentReference);
      if (email) {
        const text = supporter
          ? `Hello ${first},\n\nThank you for joining the HomeBridge Supporter list. Your reference is ${reference}. Please keep it and quote it in any message to us.\n\nThere is nothing to pay. We will send you news a few times a year, and invitations to open events.\n\nHomeBridge Cooperative`
          : `Hello ${first},\n\nThank you for applying to join HomeBridge Cooperative.\n\nYour application reference: ${reference}\n\nPlease keep it and quote it in any message to us about your application. Your permanent membership number is issued when your application is approved.\n\n` +
            (paid
              ? `You told us you paid the joining fee of ${fee}${draft.paymentReference ? `, with the reference ${draft.paymentReference}` : ''}. We will confirm it against our account. There is nothing further for you to do.`
              : `If you have not paid the joining fee of ${fee} yet, please write ${reference} as the reference (or narration) on your transfer, so we can match your payment to you straight away.`) +
            `\n\nYou can follow your application in the HomeBridge app or on the website.\n\nHomeBridge Cooperative`;
        const sent = await sendEmail(email, supporter ? 'You’re on the HomeBridge Supporter list' : `Your HomeBridge application ${reference}`, text);
        if (!sent.ok) console.error('[api/apply] confirmation email not sent:', sent.error);
      }
      const alert = await emailOffice(
        `New ${supporter ? 'supporter' : 'application'}: ${draft.fullName} (${reference})`,
        [
          `${draft.fullName} has ${supporter ? 'joined the Supporter list' : 'applied'} in the HomeBridge app.`,
          '',
          `Reference: ${reference}`,
          `Email: ${email || '—'}`,
          `Phone: ${phone || '—'}`,
          supporter ? '' : `Membership type: ${TYPE_LABEL[draft.memberType] ?? draft.memberType}`,
          `Country: ${countryName(draft)}`,
          `Chapter: ${draft.chapter}`,
          supporter ? '' : `Joining fee: ${draft.paymentMethod}`,
          '',
          'Open the admin panel to review it.',
        ]
          .filter((l) => l !== '')
          .join('\n'),
      );
      if (!alert.ok) console.error('[api/apply] office alert not sent:', alert.error);
    }

    return ok({ reference, status: supporter ? 'Supporter' : 'Submitted', ...makeToken(reference) });
  } catch (err) {
    // Never let the error text out: a Mongo error can carry the connection string.
    console.error('[api/apply] could not store the application:', err instanceof Error ? err.message : 'unknown error');
    return fail(502, 'We could not send your application just now. Please try again.');
  }
}
