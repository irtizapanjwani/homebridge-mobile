import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { api } from '@/lib/api';

export type DownloadRequest =
  | { kind: 'certificate' }
  | { kind: 'receipt' }
  | { kind: 'contribution'; receiptNo: string }
  | { kind: 'statement'; from: string; to: string; format: 'pdf' | 'csv' }
  | { kind: 'form'; form: 'declaration' | 'nominee' };

/**
 * Opens one of the member's own documents. The API returns a link that works for 5 minutes (a
 * browser can't send the sign-in token), and the phone opens it in its in-app browser, where the
 * PDF can be viewed, saved or shared. Throws an Error with a message to show.
 */
export async function openDownload(token: string | null, req: DownloadRequest) {
  if (!token) throw new Error('Please sign in again.');
  const { url } = await api<{ url: string }>('/api/download', { token, body: req });
  if (Platform.OS === 'web') globalThis.open?.(url, '_blank', 'noopener');
  else await WebBrowser.openBrowserAsync(url);
}
