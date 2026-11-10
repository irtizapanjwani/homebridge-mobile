/// <reference types="node" />
import { recordAudit } from '@/server/audit';
import { findMemberByRef, members, signedInRef } from '@/server/auth';
import { isDbConfigured } from '@/server/db';
import {
  DOC_CONTENT_TYPES,
  DOC_LABEL,
  DOC_MAX_BYTES,
  INFO_MESSAGE_MAX,
  isDocumentStorageConfigured,
  saveDocument,
  type UploadType,
} from '@/server/documents';
import { emailOffice } from '@/server/email';
import { fail, ok } from '@/server/http';

const OPEN = ['Submitted', 'In review', 'Info requested'];
const TYPES: UploadType[] = ['id', 'address', 'info'];

/**
 * POST /api/documents  (Bearer token, multipart form)
 *   type=id | address   file required — ID photo or proof of address
 *   type=info           reply to the office: message and/or file; moves the application back to "In review"
 * Same rules as the website's /api/member/documents.
 */
export async function POST(req: Request) {
  if (!isDbConfigured()) return fail(503, 'Storage is not configured');
  const ref = signedInRef(req);
  if (!ref) return fail(401, 'Please sign in again');

  // React Native's FormData type has no .get(); on the server it's the standard web FormData.
  let form: { get(name: string): unknown };
  try {
    form = (await req.formData()) as unknown as { get(name: string): unknown };
  } catch {
    return fail(400, 'That upload could not be read');
  }
  const type = form.get('type') as UploadType;
  if (!TYPES.includes(type)) return fail(400, 'Unknown document type');
  const file = form.get('file');
  const hasFile = typeof file === 'object' && file !== null && 'arrayBuffer' in file && (file as File).size > 0;
  const message = typeof form.get('message') === 'string' ? String(form.get('message')).trim().slice(0, INFO_MESSAGE_MAX) : '';

  if (type !== 'info' && !hasFile) return fail(422, 'Choose a file to upload');
  if (type === 'info' && !hasFile && !message) return fail(422, 'Add a message or a file');
  if (hasFile) {
    const f = file as File;
    if (!DOC_CONTENT_TYPES.includes(f.type)) return fail(415, 'Please upload a photo or a PDF');
    if (f.size > DOC_MAX_BYTES) return fail(413, 'That file is too large. Please upload one under 4 MB.');
    if (!isDocumentStorageConfigured()) {
      console.error('[api/documents] DOCUMENTS_KEY is not set — an upload was refused.');
      return fail(503, 'Uploads are not available just now. Please try again later.');
    }
  }

  try {
    const member = await findMemberByRef(ref);
    if (!member) return fail(401, 'Please sign in again');
    if (member.supporter || !OPEN.includes(member.status)) return fail(409, 'Your application has already been decided');
    if (type === 'info' && member.status !== 'Info requested') return fail(409, 'We have not asked you for anything');

    let documentId = '';
    if (hasFile) {
      const f = file as File;
      documentId = await saveDocument({ ownerRef: ref, type, name: f.name, contentType: f.type, data: new Uint8Array(await f.arrayBuffer()) });
      await recordAudit({
        action: 'document.uploaded',
        actor: `Applicant (${member.fullName})`,
        subject: ref,
        detail: `${DOC_LABEL[type]} uploaded by the applicant in the app`,
      });
    }

    if (type === 'info') {
      const at = new Date();
      const res = await (await members()).updateOne(
        { reference: ref, status: 'Info requested' },
        { $set: { status: 'In review', infoResponse: { message, at, documentIds: documentId ? [documentId] : [] }, updatedAt: at } },
      );
      if (res.matchedCount === 1) {
        await recordAudit({
          action: 'application.info_received',
          actor: `Applicant (${member.fullName})`,
          subject: ref,
          detail: [message ? `Message: ${message}` : '', documentId ? 'with a file attached' : '', '(from the app)'].filter(Boolean).join(' — '),
          before: 'Info requested',
          after: 'In review',
        });
        const sent = await emailOffice(
          `Reply received: ${member.fullName} (${ref})`,
          `${member.fullName} (${ref}) has replied to your request for more information in the HomeBridge app.\n\n` +
            (message ? `Their message:\n${message}\n\n` : '') +
            (documentId ? 'They attached a file — open it in the admin panel under Applications.\n' : '') +
            'The application is back in review.',
        );
        await recordAudit({
          action: sent.ok ? 'email.info_reply_alert_sent' : 'email.info_reply_alert_failed',
          actor: 'System',
          subject: ref,
          detail: sent.ok ? 'Office emailed that the applicant replied (app)' : `Office alert not sent: ${sent.error}`,
        }).catch(() => {});
      }
    }
    return ok();
  } catch (err) {
    console.error('[api/documents] failed:', err instanceof Error ? err.message : 'unknown error');
    return fail(502, 'We could not save that just now. Please try again.');
  }
}
