import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import { ApiError, baseUrl } from '@/lib/api';

export type Picked = { uri: string; name: string; mimeType: string; size?: number };

const MAX_BYTES = 4 * 1024 * 1024;

/** Camera, photo library, or a file (PDF) — returns null if cancelled or not allowed. */
export async function pickFile(source: 'camera' | 'library' | 'file'): Promise<Picked | 'denied' | null> {
  if (source === 'file') {
    const r = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true });
    if (r.canceled || !r.assets[0]) return null;
    const a = r.assets[0];
    return { uri: a.uri, name: a.name, mimeType: a.mimeType ?? 'application/pdf', size: a.size };
  }
  const perm = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return 'denied';
  // Quality 0.6 keeps a phone photo of an ID well under the 4 MB upload limit.
  const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.6 };
  const r = source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
  if (r.canceled || !r.assets[0]) return null;
  const a = r.assets[0];
  const mimeType = a.mimeType ?? 'image/jpeg';
  return { uri: a.uri, name: a.fileName ?? `photo.${mimeType.split('/')[1] ?? 'jpg'}`, mimeType, size: a.fileSize };
}

/** Sends one file (and/or a message) to POST /api/documents. Throws ApiError with a message to show. */
export async function uploadDocument(token: string, type: 'id' | 'address' | 'info', file: Picked | null, message = '') {
  if (file?.size && file.size > MAX_BYTES) throw new ApiError('That file is too large. Please choose one under 4 MB.', 413);
  const form = new FormData();
  form.append('type', type);
  if (message) form.append('message', message);
  if (file) {
    if (Platform.OS === 'web') {
      const blob = await (await fetch(file.uri)).blob();
      form.append('file', new File([blob], file.name, { type: file.mimeType }) as unknown as Blob);
    } else {
      // React Native uploads a local file from its uri.
      form.append('file', { uri: file.uri, name: file.name, type: file.mimeType } as unknown as Blob);
    }
  }
  let res: Response;
  try {
    res = await fetch(`${baseUrl()}/api/documents`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
  } catch {
    throw new ApiError('Can’t reach HomeBridge. Check your internet connection and try again.', 0);
  }
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
  if (!res.ok || !data.ok) throw new ApiError(data.error || 'Upload failed. Please try again.', res.status);
}
