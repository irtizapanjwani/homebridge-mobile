/// <reference types="node" />
import { findMemberByRef, signedInRef } from '@/server/auth';
import { isDbConfigured } from '@/server/db';
import { DOC_CONTENT_TYPES, DOC_MAX_BYTES, isDocumentStorageConfigured } from '@/server/documents';
import { fail, ok } from '@/server/http';
import { isCurrency, proofProblem, submitProof } from '@/server/payments';

/**
 * POST /api/payment-proof  (Bearer token, multipart form)
 *   amount, currency (NGN | GBP | USD), period (YYYY-MM), paidOn (YYYY-MM-DD), bankRef, note, file
 * Shows as "Pending verification" until the Treasurer approves it on the website.
 */
export async function POST(req: Request) {
  if (!isDbConfigured()) return fail(503, 'Not available just now');
  const ref = signedInRef(req);
  if (!ref) return fail(401, 'Please sign in again');

  let form: { get(name: string): unknown };
  try {
    form = (await req.formData()) as unknown as { get(name: string): unknown };
  } catch {
    return fail(400, 'That upload could not be read');
  }
  const text = (k: string) => (typeof form.get(k) === 'string' ? String(form.get(k)).trim() : '');
  const currency = text('currency');
  if (!isCurrency(currency)) return fail(422, 'Choose the currency you paid in');
  const input = {
    amount: Number(text('amount').replace(/[^\d.]/g, '')),
    currency,
    period: text('period'),
    paidOn: text('paidOn'),
    bankRef: text('bankRef'),
    note: text('note'),
  };
  const problem = proofProblem(input);
  if (problem) return fail(422, problem);

  const file = form.get('file') as File | null;
  if (!file || typeof file !== 'object' || !('arrayBuffer' in file) || file.size === 0) return fail(422, 'Attach a photo or PDF of the bank receipt');
  if (!DOC_CONTENT_TYPES.includes(file.type)) return fail(415, 'Please upload a photo or a PDF');
  if (file.size > DOC_MAX_BYTES) return fail(413, 'That file is too large. Please upload one under 4 MB.');
  if (!isDocumentStorageConfigured()) return fail(503, 'Uploads are not available just now. Please try again later.');

  try {
    const m = await findMemberByRef(ref);
    if (!m?.membership) return fail(403, 'Only members can send proof of a contribution');
    await submitProof(m, input, { name: file.name, type: file.type, data: new Uint8Array(await file.arrayBuffer()) });
    return ok();
  } catch (err) {
    console.error('[api/payment-proof] failed:', err instanceof Error ? err.message : 'unknown error');
    return fail(502, 'We could not save that just now. Please try again.');
  }
}
