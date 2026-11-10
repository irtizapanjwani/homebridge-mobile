import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { api } from '@/lib/api';

// Keeps the sign-in token on the device: Keychain / Keystore on phones (expo-secure-store), and
// the browser's storage on the web preview. The token is what proves who you are to the API.

const KEY = 'hb_session';

type Saved = { token: string; expiresAt: string };

const store = {
  async get(): Promise<Saved | null> {
    try {
      const raw = Platform.OS === 'web' ? globalThis.localStorage?.getItem(KEY) : await SecureStore.getItemAsync(KEY);
      if (!raw) return null;
      const saved = JSON.parse(raw) as Saved;
      return new Date(saved.expiresAt).getTime() > Date.now() ? saved : null;
    } catch {
      return null;
    }
  },
  async set(v: Saved | null) {
    try {
      if (Platform.OS === 'web') {
        if (v) globalThis.localStorage?.setItem(KEY, JSON.stringify(v));
        else globalThis.localStorage?.removeItem(KEY);
      } else if (v) await SecureStore.setItemAsync(KEY, JSON.stringify(v));
      else await SecureStore.deleteItemAsync(KEY);
    } catch {
      /* storage unavailable: the session just won't survive a restart */
    }
  },
};

type Session = {
  ready: boolean; // false until we've checked the device for a saved sign-in
  token: string | null;
  signIn: (login: string, password: string, remember: boolean) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    store.get().then((s) => {
      setToken(s?.token ?? null);
      setReady(true);
    });
  }, []);

  const signIn = useCallback(async (login: string, password: string, remember: boolean) => {
    const res = await api<{ token: string; expiresAt: string }>('/api/auth/login', { body: { login, password } });
    setToken(res.token);
    // "Keep me signed in" off: valid for this session only, nothing saved on the device.
    await store.set(remember ? { token: res.token, expiresAt: res.expiresAt } : null);
  }, []);

  const signOut = useCallback(async () => {
    setToken(null);
    await store.set(null);
  }, []);

  return <SessionContext.Provider value={{ ready, token, signIn, signOut }}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
