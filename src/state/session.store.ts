import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { create } from 'zustand';
import type { CatalogId } from '../a2ui/registry';
import type { SessionResponse } from '../api/types';

const SESSION_ID_KEY = 'la-mesa.session_id';
const USER_ID_KEY = 'la-mesa.user_id';
const ACCESSIBILITY_MODE_KEY = 'la-mesa.accessibility_mode';

/**
 * `expo-secure-store` has no web implementation (its `.web.ts` module is a
 * stub `{}`, so every call throws on web — silently, since it's awaited
 * inside a React Query mutation's `onSuccess`, which swallows the rejection
 * instead of surfacing it). Web has no OS keychain to back a "secure" store
 * anyway, so `localStorage` is the standard fallback there; this app has no
 * real auth system to protect (SPECS.md §12 — session_id just identifies a
 * mocked demo session), so the reduced security on web is an accepted trade.
 */
async function storageGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

async function storageSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Private browsing / storage disabled — session just won't persist across reloads.
    }
    return;
  }
  return SecureStore.setItemAsync(key, value);
}

async function storageDelete(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(key);
    } catch {
      // no-op
    }
    return;
  }
  return SecureStore.deleteItemAsync(key);
}

type SessionStore = {
  sessionId: string | null;
  userId: string | null;
  /** Real value of `accessibility_profiles.mode` from the backend (e.g. 'low_literacy'), or null — REQ-ACC-01. */
  accessibilityMode: string | null;
  /** Has the persisted session been checked yet? Gates the initial route decision (app/index.tsx). */
  hasHydrated: boolean;

  hydrateFromStorage: () => Promise<void>;
  setSession: (session: SessionResponse, accessibilityMode: string | null) => Promise<void>;
  clearSession: () => Promise<void>;
};

/**
 * REQ-ACC-01/02: any non-null accessibility mode on the account means the
 * accessible catalog + full-duplex voice UX activate automatically — this is
 * not a user-facing toggle anywhere in the app. The mode itself comes from
 * the backend (GET /api/profile -> accessibility_profiles.mode), not a
 * client-side guess.
 */
export function accessibilityModeToCatalogId(mode: string | null): CatalogId {
  return mode ? 'voz-color' : 'standard';
}

export const useSessionStore = create<SessionStore>((set) => ({
  sessionId: null,
  userId: null,
  accessibilityMode: null,
  hasHydrated: false,

  hydrateFromStorage: async () => {
    const [sessionId, userId, accessibilityMode] = await Promise.all([
      storageGet(SESSION_ID_KEY).catch(() => null),
      storageGet(USER_ID_KEY).catch(() => null),
      storageGet(ACCESSIBILITY_MODE_KEY).catch(() => null),
    ]);
    set({ sessionId, userId, accessibilityMode, hasHydrated: true });
  },

  setSession: async (session, accessibilityMode) => {
    await Promise.all([
      storageSet(SESSION_ID_KEY, session.session_id),
      storageSet(USER_ID_KEY, session.user_id),
      accessibilityMode
        ? storageSet(ACCESSIBILITY_MODE_KEY, accessibilityMode)
        : storageDelete(ACCESSIBILITY_MODE_KEY).catch(() => undefined),
    ]);
    set({ sessionId: session.session_id, userId: session.user_id, accessibilityMode });
  },

  clearSession: async () => {
    await Promise.all([
      storageDelete(SESSION_ID_KEY).catch(() => undefined),
      storageDelete(USER_ID_KEY).catch(() => undefined),
      storageDelete(ACCESSIBILITY_MODE_KEY).catch(() => undefined),
    ]);
    set({ sessionId: null, userId: null, accessibilityMode: null });
  },
}));

export function useActiveCatalogId(): CatalogId {
  return useSessionStore((s) => accessibilityModeToCatalogId(s.accessibilityMode));
}
