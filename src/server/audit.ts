/// <reference types="node" />
// Writes to the website's audit log, so officers see what applicants did in the app too.
import { getDb } from './db';

export async function recordAudit(entry: { action: string; actor: string; subject: string; detail: string; before?: string; after?: string }) {
  await (await getDb()).collection('audit_log').insertOne({ ...entry, at: new Date() });
}
