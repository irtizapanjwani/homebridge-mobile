/// <reference types="node" />
// Emails from the app, copied from the website (HomeBridge lib/email.ts and lib/email-templates.ts)
// so members get exactly the same emails whichever one they use: same look, same wording, same
// Resend settings (RESEND_API_KEY, EMAIL_FROM, EMAIL_REPLY_TO, EMAIL_BCC, OFFICE_ALERT_EMAIL), and the
// application email reads the wording the office saved in admin Settings (the "settings" collection).

import { getDb } from './db';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const TEST_FROM = 'onboarding@resend.dev';
const DEFAULT_OFFICE_ALERT = 'info@homebridgecooperative.org';
const MOTTO = 'HOMEBRIDGE!!! Connecting People! Building Trust! Creating Wealth!';

export const isEmailConfigured = () => Boolean(process.env.RESEND_API_KEY);

/** The website's address, for links in emails (the admin panel). Same SITE_URL setting as the website. */
export const siteUrl = () => (process.env.SITE_URL?.trim() || 'https://homebridge-two.vercel.app').replace(/\/+$/, '');

export type SendResult = { ok: true; id: string } | { ok: false; error: string };

/** Sends one email. Never throws: a mail failure must not fail what triggered it. */
export async function sendEmail(input: { to: string; subject: string; text: string; html: string; headers?: Record<string, string> }): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY is not set' };
  const from = process.env.EMAIL_FROM?.trim() || TEST_FROM;
  const bcc = process.env.EMAIL_BCC?.trim() || '';
  const replyTo = process.env.EMAIL_REPLY_TO?.trim() || '';
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html,
        ...(bcc ? { bcc: [bcc] } : {}),
        ...(input.headers && Object.keys(input.headers).length ? { headers: input.headers } : {}),
        ...(replyTo ? { reply_to: [replyTo] } : {}),
      }),
    });
    const data = (await res.json().catch(() => null)) as { id?: string; message?: string } | null;
    if (!res.ok) return { ok: false, error: data?.message || `Resend returned ${res.status}` };
    return { ok: true, id: data?.id || '' };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'unknown error' };
  }
}

const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The card every one-off email uses (sign-in code, reset, supporter, office alerts). */
const card = (inner: string, width = 560) => `<!doctype html>
<html><body style="margin:0;padding:24px;background:#F3F1EA;font-family:ui-sans-serif,system-ui,'Segoe UI',Arial,sans-serif;color:#1D201C;line-height:1.6">
  <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:${width}px;margin:0 auto;background:#FFFDF7;border-radius:12px;border:1px solid #E2DED2">
    <tr><td style="padding:28px">
      ${inner}
    </td></tr>
  </table>
</body></html>`;
const footer = `<p style="margin:0;padding-top:16px;border-top:1px solid #E2DED2;font-size:13px;color:#6B6A61">HomeBridge Cooperative</p>`;
const codeBox = (code: string) =>
  `<p style="margin:0 0 16px;padding:14px;background:#F3F1EA;border-radius:8px;text-align:center;font-size:30px;font-weight:700;letter-spacing:.3em">${esc(code)}</p>`;

// ---------- Templates the office can edit (website lib/email-templates.ts) ----------

type Template = { subject: string; body: string };
type Block = { html: string; text: string };

const DEFAULT_TEMPLATES: Record<'A', Template> = {
  A: {
    subject: 'HomeBridge application received ({{ApplicationRef}})',
    body: `Hello {{FirstName}},

Thank you for applying to join **HomeBridge Cooperative**. We have your application.

{{REFERENCE_BOX}}

Please keep it and quote it in any message to us about your application. Your permanent membership number is issued when your application is approved.

{{FeeNote}}

A membership officer reviews your application. We decide within 30 days, and aim for 2 working days.

HomeBridge Cooperative`,
  },
};

/** The office's saved wording from admin Settings, or the default. Never throws. */
async function getTemplate(key: keyof typeof DEFAULT_TEMPLATES): Promise<Template> {
  try {
    const doc = await (await getDb()).collection<{ _id: string; value: unknown }>('settings').findOne({ _id: `email_template_${key}` });
    const saved = doc?.value as Template | null | undefined;
    if (saved && typeof saved.subject === 'string' && typeof saved.body === 'string') return saved;
  } catch {
    // A database problem must never stop an email going: fall back to the default wording.
  }
  return DEFAULT_TEMPLATES[key];
}

const inlineHtml = (text: string, vars: Record<string, string>) =>
  esc(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\{\{\s*([A-Za-z]+)\s*\}\}/g, (_, n: string) => esc(vars[n] ?? ''));
const inlineText = (text: string, vars: Record<string, string>) =>
  text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\{\{\s*([A-Za-z]+)\s*\}\}/g, (_, n: string) => vars[n] ?? '');
const P = 'margin:0 0 16px;font-size:15px;line-height:1.6';

function renderBlock(lines: string[], vars: Record<string, string>, html: string[], text: string[]) {
  if (!lines.length) return;
  if (lines[0].startsWith('## ')) {
    const title = lines[0].slice(3).trim();
    html.push(`<h2 style="margin:4px 0 8px;font-size:17px;color:#17452F">${inlineHtml(title, vars)}</h2>`);
    text.push(inlineText(title, vars).toUpperCase());
    renderBlock(lines.slice(1), vars, html, text);
    return;
  }
  if (lines.every((l) => /^-\s+/.test(l))) {
    const items = lines.map((l) => l.replace(/^-\s+/, ''));
    html.push(`<ul style="margin:0 0 16px;padding-left:22px;font-size:15px;line-height:1.7">${items.map((i) => `<li>${inlineHtml(i, vars)}</li>`).join('')}</ul>`);
    text.push(items.map((i) => `- ${inlineText(i, vars)}`).join('\n'));
    return;
  }
  if (lines.every((l) => /^\d+\.\s+/.test(l))) {
    const items = lines.map((l) => l.replace(/^\d+\.\s+/, ''));
    html.push(`<ol style="margin:0 0 16px;padding-left:22px;font-size:15px;line-height:1.7">${items.map((i) => `<li>${inlineHtml(i, vars)}</li>`).join('')}</ol>`);
    text.push(items.map((i, n) => `${n + 1}. ${inlineText(i, vars)}`).join('\n'));
    return;
  }
  const plain = lines.map((l) => inlineText(l, vars));
  if (!plain.join('').trim()) return;
  html.push(`<p style="${P}">${lines.map((l) => inlineHtml(l, vars)).join('<br>')}</p>`);
  text.push(plain.join('\n'));
}

function renderEmail(t: Template, vars: Record<string, string>, blocks: Record<string, Block | undefined> = {}) {
  const html: string[] = [];
  const text: string[] = [];
  for (const para of t.body.replace(/\r\n/g, '\n').split(/\n\s*\n/)) {
    const lines = para.split('\n').map((l) => l.trimEnd()).filter((l) => l.trim());
    if (!lines.length) continue;
    const only = lines.length === 1 ? lines[0].trim().match(/^\{\{\s*([A-Z_]+)\s*\}\}$/) : null;
    if (only) {
      const b = blocks[only[1]];
      if (b) {
        html.push(b.html);
        text.push(b.text);
      }
      continue;
    }
    renderBlock(lines, vars, html, text);
  }
  return {
    subject: inlineText(t.subject, vars).replace(/\s+/g, ' ').trim(),
    text: [MOTTO, '', ...text.flatMap((x) => [x, ''])].join('\n').trim(),
    html: `<!doctype html>
<html><body style="margin:0;padding:24px 12px;background:#F3F1EA;font-family:ui-sans-serif,system-ui,'Segoe UI',Arial,sans-serif;color:#1A1D1A">
  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;margin:0 auto;background:#FFFDF7;border-radius:14px;border:1px solid #E2DED2">
    <tr><td style="padding:28px">
      <p style="margin:0 0 18px;font-size:12px;font-weight:700;letter-spacing:.06em;color:#C9A227">${esc(MOTTO)}</p>
      ${html.join('\n      ')}
    </td></tr>
  </table>
</body></html>`,
  };
}

function highlightBox(label: string, value: string): Block {
  return {
    html: `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 16px;background:#F3F1EA;border-radius:8px"><tr><td style="padding:16px;text-align:center"><div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#6B6A61">${esc(label)}</div><div style="font-size:22px;font-weight:700;letter-spacing:.04em;margin-top:4px">${esc(value)}</div></td></tr></table>`,
    text: `${label}: ${value}`,
  };
}

// ---------- Applicant / member emails ----------

/** Email A (applicants, office-editable) or the Supporter-list confirmation — same as the website. */
export async function sendApplicationConfirmation(input: {
  to: string;
  firstName: string;
  reference: string;
  supporter: boolean;
  fee?: string;
  paymentReference?: string;
  paidReported: boolean;
}): Promise<SendResult> {
  const name = input.firstName.trim() || 'there';
  const ref = input.reference;
  const payRef = input.paymentReference?.trim() || '';

  if (!input.supporter) {
    const feeNote =
      input.paidReported || payRef
        ? `You told us you paid the joining fee${input.fee ? ` of ${input.fee}` : ''}${payRef ? `, with the reference ${payRef}` : ''}. We will confirm it against our account. There is nothing further for you to do.`
        : `If you have not paid the joining fee${input.fee ? ` of ${input.fee}` : ''} yet, please write ${ref} as the reference (or narration) on your transfer. That way we can match your payment to you straight away.`;
    const email = renderEmail(
      await getTemplate('A'),
      { FirstName: name, ApplicationRef: ref, Fee: input.fee ?? '', PaymentReference: payRef, FeeNote: feeNote },
      { REFERENCE_BOX: highlightBox('Your application reference', ref) },
    );
    return sendEmail({ to: input.to, ...email });
  }

  const text = [
    `Hello ${name},`,
    '',
    'Thank you for joining the HomeBridge Cooperative Supporter list.',
    '',
    `Your reference: ${ref}`,
    'Please keep it. Quote it in any message to us.',
    '',
    'There is nothing to pay. We will send you news a few times a year, and invitations to open events.',
    '',
    'You can leave the list at any time. Just message us.',
    '',
    'HomeBridge Cooperative',
  ].join('\n');
  const html = card(`<p style="margin:0 0 16px">Hello ${esc(name)},</p>
      <p style="margin:0 0 16px">Thank you for joining the <strong>HomeBridge Cooperative</strong> Supporter list.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 16px;background:#F3F1EA;border-radius:8px">
        <tr><td style="padding:16px;text-align:center">
          <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#6B6A61">Your reference</div>
          <div style="font-size:22px;font-weight:700;letter-spacing:.04em;margin-top:4px">${esc(ref)}</div>
        </td></tr>
      </table>
      <p style="margin:0 0 16px">Please keep it. Quote it in any message to us.</p>
      <p style="margin:0 0 16px">There is nothing to pay. We will send you news a few times a year, and invitations to open events.</p>
      <p style="margin:0 0 20px">You can leave the list at any time. Just message us.</p>
      ${footer}`);
  return sendEmail({ to: input.to, subject: `You're on the HomeBridge Supporter list — ${ref}`, text, html });
}

/** The 6-digit sign-in code — word for word the website's email. */
export async function sendLoginCode(input: { to: string; firstName: string; code: string; minutes: number }): Promise<SendResult> {
  const name = input.firstName.trim() || 'there';
  const text = [
    `Hello ${name},`,
    '',
    `Your HomeBridge sign-in code is: ${input.code}`,
    '',
    `Enter it on the sign-in page within ${input.minutes} minutes. It works once.`,
    '',
    'If you did not ask to sign in, you can ignore this email. Nobody can use the code unless they can read this inbox.',
    '',
    'HomeBridge Cooperative',
  ].join('\n');
  const html = card(
    `<p style="margin:0 0 16px">Hello ${esc(name)},</p>
      <p style="margin:0 0 12px">Your <strong>HomeBridge</strong> sign-in code is:</p>
      ${codeBox(input.code)}
      <p style="margin:0 0 16px">Enter it on the sign-in page within ${input.minutes} minutes. It works once.</p>
      <p style="margin:0 0 20px;font-size:14px;color:#6B6A61">If you did not ask to sign in, you can ignore this email. Nobody can use the code unless they can read this inbox.</p>
      ${footer}`,
    520,
  );
  return sendEmail({ to: input.to, subject: `Your HomeBridge sign-in code: ${input.code}`, text, html });
}

/** The app's password-reset code, in the website's reset-email wording and look (a code instead of a link). */
export async function sendPasswordResetCode(input: { to: string; firstName: string; code: string; minutes: number }): Promise<SendResult> {
  const name = input.firstName.trim() || 'there';
  const text = [
    `Hello ${name},`,
    '',
    'Someone asked to reset the password on your HomeBridge Cooperative account.',
    '',
    `Your code to choose a new password is: ${input.code}`,
    `Enter it in the HomeBridge app. It works once, and expires in ${input.minutes} minutes.`,
    '',
    'If this was not you, you can ignore this email. Your password has not changed, and nobody can',
    'use the code unless they can read this inbox.',
    '',
    'HomeBridge Cooperative',
  ].join('\n');
  const html = card(`<p style="margin:0 0 16px">Hello ${esc(name)},</p>
      <p style="margin:0 0 16px">Someone asked to reset the password on your <strong>HomeBridge Cooperative</strong> account.</p>
      <p style="margin:0 0 12px">Your code to choose a new password is:</p>
      ${codeBox(input.code)}
      <p style="margin:0 0 16px;font-size:14px;color:#6B6A61">Enter it in the HomeBridge app. It works once and expires in ${input.minutes} minutes.</p>
      <p style="margin:0 0 20px">If this was not you, you can ignore this email. Your password has not changed, and nobody can use the code unless they can read this inbox.</p>
      ${footer}`);
  return sendEmail({ to: input.to, subject: 'Reset your HomeBridge password', text, html });
}

// ---------- Office alerts (website sendOfficeAlert / sendInfoReplyAlert) ----------

function officeRecipients(): string[] {
  const raw = process.env.OFFICE_ALERT_EMAIL?.trim();
  if (raw === 'off') return [];
  return (raw || DEFAULT_OFFICE_ALERT).split(',').map((s) => s.trim()).filter(Boolean);
}
const officeAlertSubject = (kind: string, fullName: string, reference: string) => `New HomeBridge ${kind.toLowerCase()}: ${fullName} (${reference})`;
export type AlertThread = { subject: string; ids: Record<string, string> };

async function messageIdOf(emailId: string): Promise<string | null> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !emailId) return null;
  try {
    const res = await fetch(`${RESEND_ENDPOINT}/${encodeURIComponent(emailId)}`, { headers: { Authorization: `Bearer ${apiKey}` } });
    if (!res.ok) return null;
    const d = (await res.json().catch(() => null)) as { message_id?: string } | null;
    const id = d?.message_id?.trim();
    return id ? (id.startsWith('<') ? id : `<${id}>`) : null;
  } catch {
    return null;
  }
}

/** Tells the office someone has applied. Contact details only, never ID. Returns the thread for later replies. */
export async function sendOfficeAlert(input: {
  reference: string;
  fullName: string;
  kind: string;
  email?: string;
  phone?: string;
  memberType?: string;
  country?: string;
  chapter?: string;
  paymentMethod?: string;
}): Promise<SendResult & { thread?: AlertThread }> {
  const recipients = officeRecipients();
  if (!recipients.length) return { ok: true, id: '' };
  const adminUrl = `${siteUrl()}/admin`;
  const rows = (
    [
      ['Reference', input.reference],
      ['Name', input.fullName],
      ['Type', input.kind],
      ['Email', input.email || ''],
      ['Phone', input.phone || ''],
      ['Membership', input.memberType || ''],
      ['Country', input.country || ''],
      ['Chapter', input.chapter || ''],
      ['Payment', input.paymentMethod || ''],
    ] as [string, string][]
  ).filter(([, v]) => v.trim());
  const subject = officeAlertSubject(input.kind, input.fullName, input.reference);
  const text = [
    `A new ${input.kind.toLowerCase()} has just come in on the HomeBridge app.`,
    '',
    ...rows.map(([k, v]) => `${k}: ${v}`),
    '',
    `Open it in the admin panel: ${adminUrl}`,
    '',
    'ID documents are not included in this email. View them in the admin panel.',
  ].join('\n');
  const html = card(`<p style="margin:0 0 16px">A new <strong>${esc(input.kind.toLowerCase())}</strong> has just come in on the HomeBridge app.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 20px;background:#F3F1EA;border-radius:8px">
        ${rows.map(([k, v]) => `<tr><td style="padding:8px 16px;color:#6B6A61;font-size:13px;width:120px">${esc(k)}</td><td style="padding:8px 16px;font-weight:600">${esc(v)}</td></tr>`).join('')}
      </table>
      <p style="margin:0 0 20px"><a href="${esc(adminUrl)}" style="display:inline-block;background:#1F4D3A;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">Open the admin panel</a></p>
      <p style="margin:0;padding-top:16px;border-top:1px solid #E2DED2;font-size:13px;color:#6B6A61">ID documents are not included in this email. View them in the admin panel.</p>`);
  let last: SendResult = { ok: true, id: '' };
  const ids: Record<string, string> = {};
  for (const to of recipients) {
    const sent = await sendEmail({ to, subject, text, html });
    if (!sent.ok) last = sent;
    else if (sent.id) ids[to] = sent.id;
  }
  return { ...last, thread: { subject, ids } };
}

/** Tells the office an applicant answered "more information needed" — as a reply in the same conversation. */
export async function sendInfoReplyAlert(input: {
  reference: string;
  fullName: string;
  email?: string;
  asked?: string;
  message: string;
  withFile: boolean;
  thread?: AlertThread;
  kind?: string;
}): Promise<SendResult> {
  const recipients = officeRecipients();
  if (!recipients.length) return { ok: true, id: '' };
  const adminUrl = `${siteUrl()}/admin#applications`;
  const subject = `Re: ${input.thread?.subject || officeAlertSubject(input.kind || 'Application', input.fullName, input.reference)}`;
  const text = [
    `${input.fullName} has replied to your request for more information on their HomeBridge application (from the app).`,
    '',
    `Application: ${input.reference}`,
    input.email ? `Email: ${input.email}` : '',
    input.asked ? `You asked: ${input.asked}` : '',
    '',
    'Their reply:',
    input.message || '(no message)',
    input.withFile ? '\nThey also attached a file. Open it in the admin panel.' : '',
    '',
    'The application is back "In review" and waiting for you.',
    `Open it: ${adminUrl}`,
  ]
    .filter((l) => l !== '')
    .join('\n');
  const html = card(
    `<p style="margin:0 0 16px;font-size:17px"><strong>Update: ${esc(input.fullName)} has sent the information you asked for.</strong></p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 16px;background:#F3F1EA;border-radius:8px">
        <tr><td style="padding:8px 16px;color:#6B6A61;font-size:13px;width:120px">Application</td><td style="padding:8px 16px;font-weight:600">${esc(input.reference)}</td></tr>
        ${input.email ? `<tr><td style="padding:8px 16px;color:#6B6A61;font-size:13px">Email</td><td style="padding:8px 16px;font-weight:600">${esc(input.email)}</td></tr>` : ''}
        ${input.asked ? `<tr><td style="padding:8px 16px;color:#6B6A61;font-size:13px">You asked</td><td style="padding:8px 16px">${esc(input.asked)}</td></tr>` : ''}
      </table>
      <p style="margin:0 0 6px;font-size:13px;color:#6B6A61">Their reply</p>
      <div style="margin:0 0 16px;padding:14px 16px;border-left:4px solid #1F4D3A;background:#F3F1EA;border-radius:4px;white-space:pre-wrap">${esc(input.message || '(no message)')}</div>
      ${input.withFile ? '<p style="margin:0 0 16px"><strong>They also attached a file.</strong> Open it in the admin panel.</p>' : ''}
      <p style="margin:0 0 20px">The application is back <strong>In review</strong> and waiting for you.</p>
      <p style="margin:0"><a href="${esc(adminUrl)}" style="display:inline-block;background:#1F4D3A;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">Open the application</a></p>`,
  );
  let last: SendResult = { ok: true, id: '' };
  for (const to of recipients) {
    const original = input.thread?.ids[to] ? await messageIdOf(input.thread.ids[to]) : null;
    const headers = original ? { 'In-Reply-To': original, References: original } : undefined;
    const sent = await sendEmail({ to, subject, text, html, headers });
    if (!sent.ok) last = sent;
  }
  return last;
}
