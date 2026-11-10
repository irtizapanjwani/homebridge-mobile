/// <reference types="node" />
// The member's own documents as PDFs (and the statement as CSV): certificate, joining fee receipt,
// contribution receipts, statements and their signed forms. Built from the record each time with
// the website's own PDF code (src/server/pdf, copied from HomeBridge lib/pdf), so a download from the
// app is identical to one from the website.

import { getDb } from './db';
import { packMemberOf } from './forms';
import { money } from './me';
import { periodLabel } from './payments';
import { buildCertificate, certificateNoFor } from './pdf/certificate';
import { buildContributionReceipt } from './pdf/contribution-receipt';
import { FormWriter, MUTED } from './pdf/layout';
import { buildReceipt } from './pdf/receipt';
import { CONTACT, JOINING_FEE, SHARE_PRICE_NGN } from './site';
import type { ContributionDoc, Currency, MemberDoc } from './types';

export type Download = { filename: string; contentType: string; body: Uint8Array | string };

const CURRENCIES: Currency[] = ['NGN', 'GBP', 'USD'];
const DAY = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Lagos', day: 'numeric', month: 'short', year: 'numeric' });
const SHARES_NOTE = 'Naira contributions buy shares at ₦1,000 each. Pound and dollar contributions are converted to shares at the rate the Board sets.';
const sharesFor = (amount: number, currency: Currency) => (currency === 'NGN' ? Math.round((amount / SHARE_PRICE_NGN) * 100) / 100 : null);
export const isPeriod = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(v);

const contributionsOf = async (memberRef: string) =>
  (await getDb()).collection<ContributionDoc>('contributions').find({ memberRef }).sort({ paidAt: -1 }).toArray();

export async function certificateFor(m: MemberDoc): Promise<Download | null> {
  const pack = packMemberOf(m);
  if (!pack) return null;
  const certificateNo = certificateNoFor(pack.memberNo);
  const pdf = await buildCertificate({
    certificateNo,
    fullName: m.fullName,
    memberNo: pack.memberNo,
    category: pack.category,
    chapter: pack.chapter,
    admittedAt: pack.admittedAt,
    founding: pack.founding,
  });
  return { filename: `${certificateNo}.pdf`, contentType: 'application/pdf', body: pdf };
}

/** The VEKAT joining fee receipt, once the fee is confirmed. */
export async function joiningReceiptFor(m: MemberDoc): Promise<Download | null> {
  const receiptNo = m.payment?.receiptNo;
  if (!receiptNo) return null;
  const home = m.country === 'Nigeria';
  const pdf = await buildReceipt({
    receiptNo,
    fullName: m.fullName,
    applicationRef: m.reference,
    memberNo: m.membership?.memberNo,
    category: packMemberOf(m)?.category ?? (home ? 'Home' : 'Diaspora'),
    amount: home ? JOINING_FEE.ngn : JOINING_FEE.gbp,
    currency: home ? 'NGN' : 'GBP',
    method: m.payment?.method || 'Not recorded',
    transactionRef: m.payment?.reference,
    receivedAt: m.payment?.verifiedAt ?? m.updatedAt ?? m.submittedAt,
    payee: JOINING_FEE.payee,
    payeeRole: JOINING_FEE.payeeRole,
  });
  return { filename: `${receiptNo}.pdf`, contentType: 'application/pdf', body: pdf };
}

/** One contribution receipt (HBC-CR-…), only if it belongs to this member. */
export async function contributionReceiptFor(m: MemberDoc, receiptNo: string): Promise<Download | null> {
  if (!/^HBC-CR-\d{4}-\d{5,}$/.test(receiptNo)) return null;
  const c = await (await getDb()).collection<ContributionDoc>('contributions').findOne({ receiptNo });
  if (!c || c.memberRef !== m.reference) return null;
  const pdf = await buildContributionReceipt({
    receiptNo: c.receiptNo,
    fullName: m.fullName || c.memberName || `Member ${c.memberNo}`,
    memberNo: c.memberNo,
    amount: c.amount,
    currency: c.currency,
    period: periodLabel(c.period),
    paidAt: c.paidAt,
    bankRef: c.bankRef ?? '',
    shares: sharesFor(c.amount, c.currency),
  });
  return { filename: `${receiptNo}.pdf`, contentType: 'application/pdf', body: pdf };
}

// ---------- Statement (website lib/statements.ts) ----------

const totalsOf = (list: ContributionDoc[]) =>
  CURRENCIES.map((cur) => [cur, list.filter((c) => c.currency === cur).reduce((t, c) => t + c.amount, 0)] as const)
    .filter(([, t]) => t > 0)
    .map(([cur, t]) => money(t, cur));
const join = (parts: string[]) => (parts.length ? parts.join(' + ') : 'Nothing');
const csvCell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

export async function statementFor(m: MemberDoc, from: string, to: string, format: 'pdf' | 'csv'): Promise<Download | null> {
  if (!m.membership) return null;
  const all = (await contributionsOf(m.reference)).sort((a, b) => a.period.localeCompare(b.period) || a.paidAt.getTime() - b.paidAt.getTime());
  const inRange = all.filter((c) => c.period >= from && c.period <= to);
  const toDate = all.filter((c) => c.period <= to);
  const name = `HomeBridge statement ${m.membership.memberNo} ${from}${from === to ? '' : ` to ${to}`}`;

  if (format === 'csv') {
    const rows = [
      ['Month', 'Date received', 'Amount', 'Currency', 'Receipt', 'Bank reference'],
      ...inRange.map((c) => [c.period, c.paidAt.toISOString().slice(0, 10), c.amount.toFixed(2), c.currency, c.receiptNo, c.bankRef ?? '']),
    ];
    return { filename: `${name}.csv`, contentType: 'text/csv; charset=utf-8', body: rows.map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n' };
  }

  const title = 'Member Statement';
  const range = from === to ? periodLabel(from) : `${periodLabel(from)} to ${periodLabel(to)}`;
  const w = await FormWriter.create({ title: `${title} ${m.membership.memberNo} ${range}`, subject: `HomeBridge statement for ${m.fullName}`, footerEmail: CONTACT.email });
  w.header(title);
  w.keyValues([
    ['Member', m.fullName],
    ['Membership number', m.membership.memberNo],
    ['Chapter', m.chapter],
    ['Period', range],
    ['Issued', DAY.format(new Date())],
  ]);
  w.heading('Contributions in this period');
  if (inRange.length) {
    const running: Partial<Record<Currency, number>> = {};
    for (const c of toDate.filter((x) => x.period < from)) running[c.currency] = (running[c.currency] ?? 0) + c.amount;
    w.table(
      ['Month', 'Received', 'Amount', 'Receipt', 'Running total'],
      inRange.map((c) => {
        running[c.currency] = (running[c.currency] ?? 0) + c.amount;
        return [periodLabel(c.period), DAY.format(c.paidAt), money(c.amount, c.currency), c.receiptNo, money(running[c.currency]!, c.currency)];
      }),
      [0.2, 0.18, 0.17, 0.27, 0.18],
    );
  } else {
    w.paragraph('No contributions were recorded for this period.', { color: MUTED });
  }
  const shares = Math.round(toDate.reduce((t, c) => t + (sharesFor(c.amount, c.currency) ?? 0), 0) * 100) / 100;
  w.heading('Summary');
  w.keyValues([
    ['Received in this period', join(totalsOf(inRange))],
    ['Total contributed to date', join(totalsOf(toDate))],
    ['Shares (naira contributions)', `${shares.toLocaleString('en-GB')} shares`],
  ]);
  w.paragraph(SHARES_NOTE, { size: 9.5, color: MUTED });
  w.paragraph('If anything on this statement looks wrong, reply to the email it came with or contact the office, quoting your membership number.', { size: 9.5, color: MUTED });
  w.paragraph(`Issued by HomeBridge Cooperative · ${CONTACT.email}`, { size: 9.5 });
  return { filename: `${name}.pdf`, contentType: 'application/pdf', body: await w.finish() };
}
