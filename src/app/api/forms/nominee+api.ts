/// <reference types="node" />
import { findMemberByRef, signedInRef } from '@/server/auth';
import { isDbConfigured } from '@/server/db';
import { isDocumentStorageConfigured } from '@/server/documents';
import { signNomineeForm } from '@/server/forms';
import { fail, ok } from '@/server/http';

/** POST /api/forms/nominee — a signed-in, admitted member signs their nominee form (same as the website). */
export async function POST(req: Request) {
  if (!isDbConfigured() || !isDocumentStorageConfigured()) return fail(503, 'Signing is not available just now. Please try again later.');
  const ref = signedInRef(req);
  if (!ref) return fail(401, 'Please sign in again');
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return fail(400, 'Invalid request');
  try {
    const m = await findMemberByRef(ref);
    if (!m) return fail(401, 'Please sign in again');
    const r = await signNomineeForm(m, body);
    return r.ok ? ok() : fail(r.status, r.error);
  } catch (err) {
    console.error('[api/forms/nominee] failed:', err instanceof Error ? err.message : 'unknown error');
    return fail(502, 'We could not save your form. Please try again.');
  }
}
