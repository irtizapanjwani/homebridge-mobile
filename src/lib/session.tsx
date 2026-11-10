import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { api, ApiError } from '@/lib/api';
import type { Me } from '@/server/me';

export type { Me };

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
  /** The signed-in person's own record from /api/me (null until loaded). */
  me: Me | null;
  meError: string;
  refreshMe: () => Promise<Me | null>;
  /** Signs in and returns the person's record, so the caller can send them to the right screen. */
  signIn: (login: string, password: string, remember: boolean) => Promise<Me | null>;
  signOut: () => Promise<void>;
};

/** Applicants (no membership number yet) see the applicant screens; members see the tabs. */
export const homeFor = (me: Me | null) => (me && !me.memberNo ? '/applicant' : '/home');

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [meError, setMeError] = useState('');

  const signOut = useCallback(async () => {
    setToken(null);
    setMe(null);
    await store.set(null);
  }, []);

  const loadMe = useCallback(
    async (t: string | null): Promise<Me | null> => {
      if (!t) return null;
      try {
        const res = await api<{ me: Me }>('/api/me', { token: t });
        setMe(res.me);
        setMeError('');
        return res.me;
      } catch (e) {
        // An expired or revoked sign-in: start again at Sign in.
        if (e instanceof ApiError && e.status === 401) await signOut();
        else setMeError(e instanceof Error ? e.message : 'Could not load your account.');
        return null;
      }
    },
    [signOut],
  );

  useEffect(() => {
    store.get().then(async (s) => {
      const t = s?.token ?? null;
      setToken(t);
      if (t) await loadMe(t);
      setReady(true);
    });
  }, [loadMe]);

  const signIn = useCallback(
    async (login: string, password: string, remember: boolean) => {
      const res = await api<{ token: string; expiresAt: string }>('/api/auth/login', { body: { login, password } });
      setToken(res.token);
      // "Keep me signed in" off: valid for this session only, nothing saved on the device.
      await store.set(remember ? { token: res.token, expiresAt: res.expiresAt } : null);
      return loadMe(res.token);
    },
    [loadMe],
  );

  const refreshMe = useCallback(() => loadMe(token), [loadMe, token]);

  return (
    <SessionContext.Provider value={{ ready, token, me, meError, refreshMe, signIn, signOut }}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
