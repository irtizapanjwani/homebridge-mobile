/// <reference types="node" />
// The declaration and nominee forms, signed in the app. A copy of the website's rules
// (HomeBridge lib/member-forms.ts): every statement confirmed, a drawn signature (PNG), the same PDF
// the welcome pack carries with the signature and answers filled in, stored encrypted, and the
// member record updated in the same "forms" field — so the website and admin panel see it signed.

import { recordAudit } from './audit';
import { members } from './auth';
import { saveDocument } from './documents';
import { buildDeclarationForm, buildNomineeForm, type NomineeRow, type PackMember } from './pdf/pack-forms';
import { signatureToPngDataUrl } from './signature';
import { DECLARATION_STATEMENTS } from './site';
import type { MemberDoc } from './types';

const CATEGORY: Record<string, string> = { home: 'Home', diaspora: 'Diaspora', founding: 'Founding', professional: 'Professional', group: 'Group' };

function chapterName(m: MemberDoc) {
  const bare = (m.chapter ?? '').replace(/^HomeBridge\s+/i, '').trim();
  if (!bare || /none yet/i.test(bare)) return m.country === 'Nigeria' ? m.state : m.country;
  return bare;
}

/** What the printed documents show for an admitted member (website lib/welcome-pack.ts packMemberOf). */
export function packMemberOf(m: MemberDoc): PackMember | null {
  if (!m.membership) return null;
  const home = m.country === 'Nigeria';
  return {
    fullName: m.fullName,
    memberNo: m.membership.memberNo,
    category: CATEGORY[m.memberType] ?? (home ? 'Home' : 'Diaspora'),
    home,
    chapter: chapterName(m),
    admittedAt: m.membership.admittedAt,
    founding: m.memberType === 'founding',
    phone: m.whatsapp || m.contact,
    email: m.email,
    nominees: (m.nominees ?? []).map((n) => ({ name: n.name, relationship: n.relationship, contact: n.contact, share: n.share })),
  };
}

const SIGNATURE_MAX_BYTES = 300 * 1024;

/**
 * A signature arrives as a PNG data URL (like the website) or as the app's drawn strokes, which are
 * turned into a PNG first. Anything else, or anything huge, is refused.
 */
export function decodeSignature(input: unknown): Uint8Array | null {
  const dataUrl = typeof input === 'string' ? input : signatureToPngDataUrl(input);
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/png;base64,')) return null;
  const bytes = Buffer.from(dataUrl.slice('data:image/png;base64,'.length), 'base64');
  const magic = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length < 100 || bytes.length > SIGNATURE_MAX_BYTES || magic.some((b, i) => bytes[i] !== b)) return null;
  return new Uint8Array(bytes);
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
type FormResult = { ok: true } | { ok: false; error: string; status: number };

export const DECLARATION_COUNT = DECLARATION_STATEMENTS.length;

export async function signDeclaration(m: MemberDoc, body: Record<string, unknown>): Promise<FormResult> {
  const pack = packMemberOf(m);
  if (!pack) return { ok: false, error: 'These forms open once your membership is approved', status: 409 };
  const agreed = Array.isArray(body.agreed) ? body.agreed : [];
  if (agreed.length !== DECLARATION_COUNT || !agreed.every((a) => a === true)) {
    return { ok: false, error: 'Please confirm every statement before signing.', status: 422 };
  }
  const signerName = str(body.signerName, 120);
  if (signerName.length < 3) return { ok: false, error: 'Type your full name.', status: 422 };
  const signature = decodeSignature(body.signature);
  if (!signature) return { ok: false, error: 'Please draw your signature in the box.', status: 422 };
  const photoConsent = body.photoConsent === true;

  const signedAt = new Date();
  const pdf = await buildDeclarationForm(pack, { signature, signerName, signedAt, photoConsent });
  const documentId = await saveDocument({ ownerRef: m.reference, type: 'declaration', name: `Declaration ${pack.memberNo}.pdf`, contentType: 'application/pdf', data: pdf });
  await (await members()).updateOne(
    { reference: m.reference },
    { $set: { 'forms.declaration': { signedAt, signerName, photoConsent, documentId }, updatedAt: signedAt } },
  );
  await recordAudit({
    action: 'forms.declaration_signed',
    actor: `Member (${m.fullName})`,
    subject: pack.memberNo,
    detail: `Declaration signed in the app${photoConsent ? ' · photo consent given' : ''}`,
    before: m.forms?.declaration ? 'Signed before' : 'Not returned',
    after: 'Signed',
  });
  return { ok: true };
}

const MAX_NOMINEES = 5;

export async function signNomineeForm(m: MemberDoc, body: Record<string, unknown>): Promise<FormResult> {
  const pack = packMemberOf(m);
  if (!pack) return { ok: false, error: 'These forms open once your membership is approved', status: 409 };

  const raw = Array.isArray(body.nominees) ? body.nominees.slice(0, MAX_NOMINEES) : [];
  const nominees: NomineeRow[] = raw.map((n) => {
    const r = (n ?? {}) as Record<string, unknown>;
    return {
      name: str(r.name, 120),
      relationship: str(r.relationship, 60),
      phone: str(r.phone, 40),
      email: str(r.email, 120),
      address: str(r.address, 300),
      share: Math.round(Number(r.share) * 100) / 100,
    };
  });
  if (!nominees.length) return { ok: false, error: 'Name at least one nominee.', status: 422 };
  for (const [i, n] of nominees.entries()) {
    if (n.name.length < 2) return { ok: false, error: `Nominee ${i + 1} needs a full name.`, status: 422 };
    if (!n.relationship) return { ok: false, error: `Say how nominee ${i + 1} is related to you.`, status: 422 };
    if (!n.phone && !n.email) return { ok: false, error: `Give a phone number or email for nominee ${i + 1}.`, status: 422 };
    if (!(n.share > 0)) return { ok: false, error: `Give nominee ${i + 1} a share above 0%.`, status: 422 };
  }
  const total = Math.round(nominees.reduce((t, n) => t + n.share, 0) * 100) / 100;
  if (total !== 100) return { ok: false, error: `Shares must total 100%. They total ${total}%.`, status: 422 };

  const witnessName = str(body.witnessName, 120);
  const witnessAddress = str(body.witnessAddress, 300);
  if (witnessName.length < 3) return { ok: false, error: 'Type your witness’s full name.', status: 422 };
  if (witnessAddress.length < 5) return { ok: false, error: 'Give your witness’s address.', status: 422 };
  const same = (a: string, b: string) => a.toLowerCase().replace(/\s+/g, ' ') === b.toLowerCase().replace(/\s+/g, ' ');
  if (nominees.some((n) => same(n.name, witnessName))) return { ok: false, error: 'Your witness must not be one of your nominees.', status: 422 };
  if (body.witnessAdult !== true) return { ok: false, error: 'Confirm your witness is 18 or over.', status: 422 };

  const signature = decodeSignature(body.signature);
  if (!signature) return { ok: false, error: 'Please draw your signature in the box.', status: 422 };
  const witnessSignature = decodeSignature(body.witnessSignature);
  if (!witnessSignature) return { ok: false, error: 'Ask your witness to draw their signature in their box.', status: 422 };
  const survivorInstruction = str(body.survivorInstruction, 300);

  const signedAt = new Date();
  const pdf = await buildNomineeForm(pack, { signature, signedAt, nominees, survivorInstruction, witnessName, witnessAddress, witnessSignature });
  const documentId = await saveDocument({ ownerRef: m.reference, type: 'nominee_form', name: `Nominee form ${pack.memberNo}.pdf`, contentType: 'application/pdf', data: pdf });
  await (await members()).updateOne(
    { reference: m.reference },
    {
      $set: {
        'forms.nominee': { signedAt, documentId, nominees, survivorInstruction, witnessName, witnessAddress },
        // The latest signed form replaces the nominees on record, as the form says it will.
        nominees: nominees.map((n) => ({ name: n.name, relationship: n.relationship, contact: n.phone || n.email, share: n.share })),
        updatedAt: signedAt,
      },
    },
  );
  await recordAudit({
    action: 'forms.nominee_signed',
    actor: `Member (${m.fullName})`,
    subject: pack.memberNo,
    detail: `Nominee form signed in the app — ${nominees.map((n) => `${n.name} ${n.share}%`).join(', ')} · witness ${witnessName}`,
    before: m.forms?.nominee ? 'Signed before' : 'Not returned',
    after: 'Signed',
  });
  return { ok: true };
}
