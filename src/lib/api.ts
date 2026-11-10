import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Where the app's API lives.
 * - Web (Vercel preview and `expo start --web`): same site, so relative URLs work.
 * - Phone in development: the Expo dev server on your computer.
 * - Phone in production: set EXPO_PUBLIC_API_URL to the deployed site, e.g. https://homebridge-app.vercel.app
 */
export function baseUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (Platform.OS === 'web') return '';
  const host = Constants.expoConfig?.hostUri; // e.g. 192.168.1.5:8081 while developing
  return host ? `http://${host}` : '';
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

/** Calls the app's API and returns the JSON body, or throws ApiError with a message to show. */
export async function api<T>(path: string, init: { method?: string; body?: unknown; token?: string | null } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${baseUrl()}${path}`, {
      method: init.method ?? (init.body ? 'POST' : 'GET'),
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}),
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiError('Can’t reach HomeBridge. Check your internet connection and try again.', 0);
  }
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
  if (!res.ok || data.ok === false) throw new ApiError(data.error || 'Something went wrong. Please try again.', res.status);
  return data as T;
}
