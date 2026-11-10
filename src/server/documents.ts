/// <reference types="node" />
// Stores ID photos, proof of address and replies exactly like the website (HomeBridge
// lib/documents.ts): AES-256-GCM with DOCUMENTS_KEY, the owner and type bound in as AAD, in the
// shared "documents" collection — so officers see app uploads in the admin panel as usual.
// DOCUMENTS_KEY must be the SAME value as on the website, or officers can't open the files.

import { createCipheriv, randomBytes } from 'node:crypto';
import { Binary } from 'mongodb';

import { getDb } from './db';

export type UploadType = 'id' | 'address' | 'info';
export type DocType = UploadType | 'declaration' | 'nominee_form' | 'payment_proof';
export const DOC_LABEL: Record<DocType, string> = {
  id: 'ID document',
  address: 'Proof of address',
  info: 'Sent with requested information',
  declaration: 'Signed declaration form',
  nominee_form: 'Signed nominee form',
  payment_proof: 'Proof of payment',
};
export const DOC_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];
export const DOC_MAX_BYTES = 4 * 1024 * 1024; // Vercel refuses bodies over ~4.5 MB
export const INFO_MESSAGE_MAX = 1000;

function key(): Buffer {
  const raw = process.env.DOCUMENTS_KEY?.trim();
  if (!raw) throw new Error('DOCUMENTS_KEY is not set');
  const k = Buffer.from(raw, 'base64');
  if (k.length !== 32) throw new Error('DOCUMENTS_KEY must be 32 bytes, base64-encoded');
  return k;
}

export function isDocumentStorageConfigured() {
  try {
    key();
    return true;
  } catch {
    return false;
  }
}

export async function saveDocument(input: { ownerRef: string; type: DocType; name: string; contentType: string; data: Uint8Array }) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  cipher.setAAD(Buffer.from(`${input.ownerRef}|${input.type}`));
  const encrypted = Buffer.concat([cipher.update(input.data), cipher.final()]);
  const res = await (await getDb()).collection('documents').insertOne({
    ownerRef: input.ownerRef,
    type: input.type,
    name: input.name.replace(/[^\w.\- ()]+/g, '_').slice(0, 120) || 'document',
    contentType: input.contentType,
    bytes: input.data.byteLength,
    iv: new Binary(iv),
    tag: new Binary(cipher.getAuthTag()),
    data: new Binary(encrypted),
    uploadedAt: new Date(),
    uploadedBy: 'applicant',
  });
  return String(res.insertedId);
}
