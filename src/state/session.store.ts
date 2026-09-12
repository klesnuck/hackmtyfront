import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import type { CatalogId } from '../a2ui/registry';
import type { SessionResponse } from '../api/types';

const SESSION_ID_KEY = 'la-mesa.session_id';
const USER_ID_KEY = 'la-mesa.user_id';
const ACCESSIBILITY_MODE_KEY = 'la-mesa.accessibility_mode';

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
      SecureStore.getItemAsync(SESSION_ID_KEY).catch(() => null),
      SecureStore.getItemAsync(USER_ID_KEY).catch(() => null),
      SecureStore.getItemAsync(ACCESSIBILITY_MODE_KEY).catch(() => null),
    ]);
    set({ sessionId, userId, accessibilityMode, hasHydrated: true });
  },

  setSession: async (session, accessibilityMode) => {
    await Promise.all([
      SecureStore.setItemAsync(SESSION_ID_KEY, session.session_id),
      SecureStore.setItemAsync(USER_ID_KEY, session.user_id),
      accessibilityMode
        ? SecureStore.setItemAsync(ACCESSIBILITY_MODE_KEY, accessibilityMode)
        : SecureStore.deleteItemAsync(ACCESSIBILITY_MODE_KEY).catch(() => undefined),
    ]);
    set({ sessionId: session.session_id, userId: session.user_id, accessibilityMode });
  },

  clearSession: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(SESSION_ID_KEY).catch(() => undefined),
      SecureStore.deleteItemAsync(USER_ID_KEY).catch(() => undefined),
      SecureStore.deleteItemAsync(ACCESSIBILITY_MODE_KEY).catch(() => undefined),
    ]);
    set({ sessionId: null, userId: null, accessibilityMode: null });
  },
}));

export function useActiveCatalogId(): CatalogId {
  return useSessionStore((s) => accessibilityModeToCatalogId(s.accessibilityMode));
}
