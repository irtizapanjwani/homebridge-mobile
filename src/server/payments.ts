/// <reference types="node" />
// Proof of payment and payment holidays. The website's rules (HomeBridge lib/payment-proofs.ts and
// lib/payment-holidays.ts), writing to the same collections, so officers find app requests in the
// same admin queues (Contributions → Proofs, Payment holidays).

import { recordAudit } from './audit';
import { getDb } from './db';
import { saveDocument } from './documents';
import { money } from './me';
import type { Currency, MemberDoc } from './types';

const PERIOD_LABEL = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
export const periodLabel = (p: string) => PERIOD_LABEL.format(new Date(`${p}-15T12:00:00Z`));
const isPeriod = (v: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(v);

// ---------- Proof of payment ----------

export const CURRENCIES = ['NGN', 'GBP', 'USD'] as const;
export const isCurrency = (v: unknown): v is Currency => typeof v === 'string' && (CURRENCIES as readonly string[]).includes(v);

export type ProofInput = { amount: number; currency: Currency; period: string; paidOn: string; bankRef: string; note: string };

export function proofProblem(i: ProofInput): string | null {
  if (!(i.amount > 0) || i.amount > 1_000_000_000) return 'Enter the amount you paid.';
  if (!isPeriod(i.period)) return 'Choose the month the payment is for.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(i.paidOn)) return 'Enter the date you paid.';
  const paid = new Date(`${i.paidOn}T12:00:00Z`);
  if (Number.isNaN(paid.getTime())) return 'Enter the date you paid.';
  if (paid.getTime() > Date.now() + 86_400_000) return 'The payment date is in the future.';
  return null;
}

export async function submitProof(member: MemberDoc, input: ProofInput, file: { name: string; type: string; data: Uint8Array }) {
  if (!member.membership) throw new Error('not a member');
  const documentId = await saveDocument({ ownerRef: member.reference, type: 'payment_proof', name: file.name, contentType: file.type, data: file.data });
  const doc = {
    memberRef: member.reference,
    memberNo: member.membership.memberNo,
    name: member.fullName,
    amount: Math.round(input.amount * 100) / 100,
    currency: input.currency,
    period: input.period,
    paidOn: input.paidOn,
    bankRef: input.bankRef.trim().slice(0, 80),
    note: input.note.trim().slice(0, 500),
    documentId,
    status: 'pending',
    submittedAt: new Date(),
  };
  const res = await (await getDb()).collection('payment_proofs').insertOne(doc);
  await recordAudit({
    action: 'proof.submitted',
    actor: `Member (${member.fullName})`,
    subject: doc.memberNo,
    detail: `Proof of payment: ${money(doc.amount, doc.currency)} for ${periodLabel(doc.period)}, paid ${doc.paidOn}${doc.bankRef ? ` · ref ${doc.bankRef}` : ''} (app)`,
  });
  return String(res.insertedId);
}

// ---------- Payment holiday ----------

export const MAX_HOLIDAY_MONTHS = 3;

function monthsFromTo(from: string, to: string) {
  const out: string[] = [];
  let [y, m] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  while ((y < ty || (y === ty && m <= tm)) && out.length < 24) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    if (++m > 12) {
      m = 1;
      y++;
    }
  }
  return out;
}
const monthIndex = (p: string) => {
  const [y, m] = p.split('-').map(Number);
  return y * 12 + m;
};
const rangeLabel = (from: string, to: string) => (from === to ? periodLabel(from) : `${periodLabel(from)} to ${periodLabel(to)}`);
function thisPeriod() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit' }).formatToParts(new Date());
  return `${parts.find((p) => p.type === 'year')!.value}-${parts.find((p) => p.type === 'month')!.value}`;
}

type HolidayDoc = { memberRef: string; memberNo: string; name: string; from: string; to: string; months: string[]; reason: string; status: string; submittedAt: Date };
const holidays = async () => (await getDb()).collection<HolidayDoc>('payment_holidays');

async function overLimit(memberRef: string, months: string[]) {
  const existing = await (await holidays()).find({ memberRef, status: { $in: ['approved', 'pending'] } }).toArray();
  const all = [...new Set([...existing.flatMap((h) => h.months), ...months])].map(monthIndex).sort((a, b) => a - b);
  for (const start of all) if (all.filter((i) => i >= start && i < start + 12).length > MAX_HOLIDAY_MONTHS) return true;
  return false;
}

export async function requestHoliday(member: MemberDoc, from: string, to: string, reason: string) {
  if (!member.membership) return { ok: false as const, error: 'Only members can ask for a payment holiday.' };
  if (!isPeriod(from) || !isPeriod(to) || from > to) return { ok: false as const, error: 'Choose the first and last month.' };
  if (from < thisPeriod()) return { ok: false as const, error: 'A payment holiday can start this month at the earliest.' };
  const why = reason.trim().slice(0, 1000);
  if (why.length < 5) return { ok: false as const, error: 'Tell us briefly why you need it.' };
  const months = monthsFromTo(from, to);
  if (months.length > MAX_HOLIDAY_MONTHS) return { ok: false as const, error: `A payment holiday can be up to ${MAX_HOLIDAY_MONTHS} months.` };
  if (await overLimit(member.reference, months)) return { ok: false as const, error: `That would be more than ${MAX_HOLIDAY_MONTHS} months of holiday in 12 months.` };
  const c = await holidays();
  if (await c.findOne({ memberRef: member.reference, status: 'pending' })) {
    return { ok: false as const, error: 'You already have a request waiting. Please wait for the answer.' };
  }
  await c.insertOne({ memberRef: member.reference, memberNo: member.membership.memberNo, name: member.fullName, from, to, months, reason: why, status: 'pending', submittedAt: new Date() });
  await recordAudit({ action: 'holiday.requested', actor: `Member (${member.fullName})`, subject: member.membership.memberNo, detail: `Payment holiday asked for ${rangeLabel(from, to)}: ${why} (app)` });
  return { ok: true as const };
}
