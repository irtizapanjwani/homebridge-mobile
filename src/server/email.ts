/// <reference types="node" />
// A short email to the office (Resend, same settings as the website). Optional: if RESEND_API_KEY
// isn't set on the app's server, nothing is sent and the reply is still saved and logged.

const DEFAULT_OFFICE = 'info@homebridgecooperative.org';

function officeRecipients() {
  const raw = process.env.OFFICE_ALERT_EMAIL?.trim();
  if (raw === 'off') return [];
  return (raw || DEFAULT_OFFICE).split(',').map((s) => s.trim()).filter(Boolean);
}

export async function emailOffice(subject: string, text: string): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = officeRecipients();
  if (!apiKey || !to.length) return { ok: false, error: 'email not configured' };
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.EMAIL_FROM?.trim() || 'onboarding@resend.dev', to, subject, text }),
    });
    return res.ok ? { ok: true } : { ok: false, error: `Resend ${res.status}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'unknown error' };
  }
}
