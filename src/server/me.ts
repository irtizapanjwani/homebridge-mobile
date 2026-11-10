/// <reference types="node" />
// Builds what the app shows a signed-in person about their own record: the same facts as the
// website's /app dashboard (HomeBridge app/app/page.tsx), shaped for the app's screens.

import { getDb } from './db';
import type { ContributionDoc, Currency, DocumentMeta, MemberDoc } from './types';

const TZ = 'Africa/Lagos';
const LONG = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, day: 'numeric', month: 'long', year: 'numeric' });
const SHORT = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric' });
const PERIOD = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });

// Same values as the website.
const INFO_REQUEST_DAYS = 14;
const SHARE_PRICE_NGN = 1_000;

const TYPE_LABEL: Record<string, string> = {
  home: 'Home member',
  diaspora: 'Diaspora member',
  founding: 'Founding member',
  professional: 'Professional member',
  group: 'Group member',
};
const ID_LABEL: Record<string, string> = { bvn: 'BVN', nin: 'NIN', nrbvn: 'Non-Resident BVN', passport: 'Passport' };
const DOC_LABEL: Record<string, string> = {
  id: 'ID document',
  address: 'Proof of address',
  info: 'Sent with requested information',
  declaration: 'Signed declaration form',
  nominee_form: 'Signed nominee form',
};
const PAY_METHOD: Record<string, string> = { bank: 'Bank transfer', card: 'Card payment' };

export function money(amount: number, currency: Currency) {
  const sym = { NGN: '₦', GBP: '£', USD: '$' }[currency];
  return `${sym}${amount.toLocaleString('en-GB', { minimumFractionDigits: currency === 'NGN' ? 0 : 2, maximumFractionDigits: 2 })}`;
}
const periodLabel = (p: string) => PERIOD.format(new Date(`${p}-15T12:00:00Z`));
const isoDay = (v: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(v) ? LONG.format(new Date(`${v}T12:00:00Z`)) : v;

export async function buildMe(m: MemberDoc) {
  const db = await getDb();
  const [docs, contribs] = await Promise.all([
    db
      .collection<DocumentMeta>('documents')
      .find({ ownerRef: m.reference, type: { $ne: 'payment_proof' } }, { projection: { data: 0, iv: 0, tag: 0 } })
      .sort({ uploadedAt: -1 })
      .toArray()
      .catch(() => [] as DocumentMeta[]),
    m.membership
      ? db
          .collection<ContributionDoc>('contributions')
          .find({ memberRef: m.reference })
          .sort({ paidAt: -1 })
          .toArray()
          .catch(() => [] as ContributionDoc[])
      : Promise.resolve([] as ContributionDoc[]),
  ]);

  const totals = (['NGN', 'GBP', 'USD'] as const)
    .map((cur) => [cur, contribs.filter((c) => c.currency === cur).reduce((t, c) => t + c.amount, 0)] as const)
    .filter(([, t]) => t > 0)
    .map(([cur, t]) => money(t, cur));
  const shares =
    Math.round(contribs.reduce((t, c) => t + (c.currency === 'NGN' ? c.amount / SHARE_PRICE_NGN : 0), 0) * 100) / 100;

  return {
    reference: m.reference,
    memberNo: m.membership?.memberNo ?? null,
    firstName: m.firstName || m.fullName.trim().split(/\s+/)[0] || '',
    fullName: [m.title, m.fullName].filter(Boolean).join(' ').trim(),
    initials: m.fullName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join(''),
    status: m.status,
    supporter: m.supporter,
    memberType: TYPE_LABEL[m.memberType] ?? '',
    chapter: m.chapter,
    submittedAt: LONG.format(m.submittedAt),
    email: m.email,
    phone: m.whatsapp || m.contact,
    address: m.address ?? '',
    city: m.city ?? '',
    country: m.country,
    livesIn: [m.city, m.country === 'Nigeria' ? m.state : '', m.country].filter(Boolean).join(', '),
    idLabel: ID_LABEL[m.idChoice] ?? '',
    nominees: m.nominees.filter((n) => n.name.trim()).map((n) => ({ name: n.name, relationship: n.relationship, contact: n.contact, share: n.share })),
    documents: docs.map((d) => ({
      id: String(d._id),
      type: d.type,
      label: DOC_LABEL[d.type] ?? d.type,
      name: d.name,
      bytes: d.bytes,
      uploadedAt: SHORT.format(d.uploadedAt),
    })),
    payment: m.payment
      ? {
          verified: m.payment.status === 'Verified',
          status: m.payment.status,
          method: PAY_METHOD[m.payment.method] ?? m.payment.method,
          datePaid: isoDay(m.payment.datePaid),
          reference: m.payment.reference,
          receiptNo: m.payment.receiptNo ?? null,
        }
      : null,
    infoRequest:
      m.status === 'Info requested' && m.decision
        ? {
            needed: m.decision.reason ?? '',
            by: LONG.format(new Date(m.decision.at.getTime() + INFO_REQUEST_DAYS * 86_400_000)),
          }
        : null,
    infoRepliedAt: m.infoResponse ? LONG.format(m.infoResponse.at) : null,
    membership: m.membership
      ? {
          memberNo: m.membership.memberNo,
          zone: m.membership.zone,
          admittedAt: LONG.format(m.membership.admittedAt),
          since: new Intl.DateTimeFormat('en-GB', { timeZone: TZ, month: 'short', year: 'numeric' }).format(m.membership.admittedAt),
        }
      : null,
    contributions: m.membership
      ? {
          currency: (m.country === 'Nigeria' ? 'NGN' : 'GBP') as Currency,
          totals,
          shares,
          items: contribs.map((c) => ({
            receiptNo: c.receiptNo,
            periodKey: c.period, // YYYY-MM, for counting months paid
            period: periodLabel(c.period),
            amount: money(c.amount, c.currency),
            paidAt: SHORT.format(c.paidAt),
          })),
        }
      : null,
  };
}

export type Me = Awaited<ReturnType<typeof buildMe>>;
