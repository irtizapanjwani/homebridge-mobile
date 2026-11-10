/// <reference types="node" />
import { recordAudit } from '@/server/audit';
import { findMemberByRef, members, normPhone, signedInRef } from '@/server/auth';
import { isDbConfigured } from '@/server/db';
import { fail, ok } from '@/server/http';

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/**
 * POST /api/contact { whatsapp, address, city }  (Bearer token)
 * Phone, address and town only — name, date of birth and email change through the office.
 * Same rules as the website's /api/member/contact; every change is logged.
 */
export async function POST(req: Request) {
  if (!isDbConfigured()) return fail(503, 'Not available just now');
  const ref = signedInRef(req);
  if (!ref) return fail(401, 'Please sign in again');
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return fail(400, 'Invalid request');
  }
  const whatsapp = str(body.whatsapp, 40);
  const address = str(body.address, 300);
  const city = str(body.city, 80);
  if (normPhone(whatsapp).length < 7) return fail(422, 'Enter a phone or WhatsApp number we can reach you on.');
  if (address.length < 5) return fail(422, 'Enter your home address.');
  if (city.length < 2) return fail(422, 'Enter your town or city.');

  try {
    const m = await findMemberByRef(ref);
    if (!m) return fail(401, 'Please sign in again');
    const before = { whatsapp: m.whatsapp || m.contact, address: m.address, city: m.city };
    const after = { whatsapp, address, city };
    const changed = (Object.keys(before) as (keyof typeof before)[]).filter((k) => (before[k] ?? '') !== after[k]);
    if (!changed.length) return ok({ changed: 0 });
    await (await members()).updateOne({ reference: ref }, { $set: { whatsapp, phoneNorm: normPhone(whatsapp), address, city, updatedAt: new Date() } });
    const label = { whatsapp: 'phone', address: 'address', city: 'town' } as const;
    await recordAudit({
      action: 'member.contact_updated',
      actor: `Member (${m.fullName})`,
      subject: m.membership?.memberNo ?? ref,
      detail: `Updated ${changed.map((k) => label[k]).join(', ')} from the app`,
      before: changed.map((k) => `${label[k]}: ${before[k] || '—'}`).join(' · '),
      after: changed.map((k) => `${label[k]}: ${after[k]}`).join(' · '),
    }).catch(() => {});
    return ok({ changed: changed.length });
  } catch (err) {
    console.error('[api/contact] failed:', err instanceof Error ? err.message : 'unknown error');
    return fail(502, 'We could not save your details. Please try again.');
  }
}
