import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import type { CatalogId } from '../a2ui/registry';
import type { SessionResponse } from '../api/types';

const SESSION_ID_KEY = 'la-mesa.session_id';

type AccessibilityProfile = NonNullable<SessionResponse['accessibility_profile']>;

type SessionStore = {
  sessionId: string | null;
  accessibilityProfile: AccessibilityProfile | null;
  /** Has the persisted session_id been checked yet? Gates the initial route decision (app/index.tsx). */
  hasHydrated: boolean;

  hydrateFromStorage: () => Promise<void>;
  setSession: (session: SessionResponse) => Promise<void>;
  clearSession: () => Promise<void>;
};

/**
 * REQ-ACC-01: any account flag (elderly/blind/low_literacy/other) means the
 * accessible catalog + full-duplex voice UX activate automatically — this is
 * not a user-facing toggle anywhere in the app.
 */
export function accessibilityProfileToCatalogId(profile: AccessibilityProfile | null): CatalogId {
  if (!profile) return 'standard';
  const isFlagged = profile.elderly || profile.blind || profile.low_literacy || profile.other;
  return isFlagged ? 'voz-color' : 'standard';
}

export const useSessionStore = create<SessionStore>((set) => ({
  sessionId: null,
  accessibilityProfile: null,
  hasHydrated: false,

  hydrateFromStorage: async () => {
    const sessionId = await SecureStore.getItemAsync(SESSION_ID_KEY).catch(() => null);
    set({ sessionId, hasHydrated: true });
  },

  setSession: async (session) => {
    await SecureStore.setItemAsync(SESSION_ID_KEY, session.session_id);
    set({ sessionId: session.session_id, accessibilityProfile: session.accessibility_profile ?? null });
  },

  clearSession: async () => {
    await SecureStore.deleteItemAsync(SESSION_ID_KEY).catch(() => undefined);
    set({ sessionId: null, accessibilityProfile: null });
  },
}));

export function useActiveCatalogId(): CatalogId {
  return useSessionStore((s) => accessibilityProfileToCatalogId(s.accessibilityProfile));
}
