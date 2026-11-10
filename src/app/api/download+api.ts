/// <reference types="node" />
import { createHmac, timingSafeEqual } from 'node:crypto';

import { findMemberByRef, signedInRef } from '@/server/auth';
import { isDbConfigured } from '@/server/db';
import { isDocumentStorageConfigured, readDocument } from '@/server/documents';
import { certificateFor, contributionReceiptFor, isPeriod, joiningReceiptFor, statementFor, type Download } from '@/server/downloads';
import { fail, ok } from '@/server/http';
import type { MemberDoc } from '@/server/types';

/**
 * Downloads for the signed-in member — only ever their own documents.
 *
 *   POST /api/download { kind, ... }  (Bearer token)  → { url }   a link that works for 5 minutes
 *   GET  /api/download?d=…&s=…                         → the file (PDF or CSV)
 *
 * kind: "certificate" | "receipt" (joining fee) | "contribution" { receiptNo }
 *       | "statement" { from, to, format: "pdf" | "csv" } | "form" { form: "declaration" | "nominee" }
 *
 * The two steps exist because a phone opens the file in the browser, which can't send the sign-in
 * token. The link is signed, names the member, and expires quickly.
 */

type Want = { ref: string; kind: string; receiptNo?: string; from?: string; to?: string; format?: 'pdf' | 'csv'; form?: string; exp: number };
const LINK_MS = 5 * 60_000;

const sign = (payload: string) =>
  createHmac('sha256', `${process.env.MEMBER_SESSION_SECRET ?? ''}|app downloads`).update(payload).digest('base64url');

async function build(m: MemberDoc, w: Want): Promise<Download | { error: string }> {
  switch (w.kind) {
    case 'certificate':
      return (await certificateFor(m)) ?? { error: 'Your certificate is issued once your membership is approved.' };
    case 'receipt':
      return (await joiningReceiptFor(m)) ?? { error: 'Your receipt is issued once your joining fee is confirmed.' };
    case 'contribution':
      return (await contributionReceiptFor(m, w.receiptNo ?? '')) ?? { error: 'That receipt was not found.' };
    case 'statement':
      if (!isPeriod(w.from) || !isPeriod(w.to) || w.from > w.to) return { error: 'Choose a valid range of months.' };
      return (await statementFor(m, w.from, w.to, w.format === 'csv' ? 'csv' : 'pdf')) ?? { error: 'Statements are for members only.' };
    case 'form': {
      const signed = w.form === 'declaration' ? m.forms?.declaration : w.form === 'nominee' ? m.forms?.nominee : undefined;
      if (!signed?.documentId || !isDocumentStorageConfigured()) return { error: 'You haven’t signed that form yet.' };
      const doc = await readDocument(signed.documentId);
      if (!doc || doc.ownerRef !== m.reference || !['declaration', 'nominee_form'].includes(doc.type)) return { error: 'You haven’t signed that form yet.' };
      return { filename: doc.name.replace(/[^\w.\- ()]+/g, '_').slice(0, 100) || 'form.pdf', contentType: 'application/pdf', body: new Uint8Array(doc.bytes) };
    }
    default:
      return { error: 'Unknown download' };
  }
}

export async function POST(req: Request) {
  if (!isDbConfigured()) return fail(503, 'Not available just now');
  const ref = signedInRef(req);
  if (!ref) return fail(401, 'Please sign in again');
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b || typeof b.kind !== 'string') return fail(400, 'Invalid request');
  const s = (v: unknown) => (typeof v === 'string' ? v.trim().slice(0, 40) : undefined);
  const want: Want = {
    ref,
    kind: b.kind,
    receiptNo: s(b.receiptNo),
    from: s(b.from),
    to: s(b.to),
    format: b.format === 'csv' ? 'csv' : 'pdf',
    form: s(b.form),
    exp: Date.now() + LINK_MS,
  };
  try {
    const m = await findMemberByRef(ref);
    if (!m) return fail(401, 'Please sign in again');
    // Built once here so a missing document is a clear message in the app, not a broken page.
    const doc = await build(m, want);
    if ('error' in doc) return fail(404, doc.error);
    const d = Buffer.from(JSON.stringify(want)).toString('base64url');
    const origin = new URL(req.url).origin;
    return ok({ url: `${origin}/api/download?d=${d}&s=${sign(d)}`, filename: doc.filename });
  } catch (err) {
    console.error('[api/download] failed:', err instanceof Error ? err.message : 'unknown error');
    return fail(502, 'Could not create the document just now');
  }
}

export async function GET(req: Request) {
  const text = (status: number, msg: string) => new Response(msg, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
  if (!isDbConfigured()) return text(503, 'Not available');
  const url = new URL(req.url);
  const d = url.searchParams.get('d') ?? '';
  const given = Buffer.from(url.searchParams.get('s') ?? '');
  const expected = Buffer.from(sign(d));
  if (!d || given.length !== expected.length || !timingSafeEqual(given, expected)) return text(403, 'This link is not valid. Please download it again from the app.');
  let want: Want;
  try {
    want = JSON.parse(Buffer.from(d, 'base64url').toString()) as Want;
  } catch {
    return text(400, 'This link is not valid.');
  }
  if (!(want.exp > Date.now())) return text(410, 'This link has expired. Please download it again from the app.');
  try {
    const m = await findMemberByRef(want.ref);
    if (!m) return text(404, 'Not found');
    const doc = await build(m, want);
    if ('error' in doc) return text(404, doc.error);
    const disposition = doc.contentType.startsWith('text/csv') ? 'attachment' : 'inline';
    return new Response(doc.body as BodyInit, {
      headers: {
        'Content-Type': doc.contentType,
        'Content-Disposition': `${disposition}; filename="${doc.filename}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    console.error('[api/download] GET failed:', err instanceof Error ? err.message : 'unknown error');
    return text(502, 'Could not create the document just now');
  }
}
