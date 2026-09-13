import { create } from 'zustand';

/**
 * A server-bound turn may not outlive this: the client `apiRequest` default is
 * 15 s and the loans flow is 12 s, so anything still holding the lock past this
 * is wedged (a fetch that never settled, a thrown path that missed `endTurn`).
 * The watchdog releases it so the assistant can never brick itself.
 */
const TURN_TIMEOUT_MS = 30_000;

let watchdog: ReturnType<typeof setTimeout> | null = null;

function clearWatchdog(): void {
  if (watchdog) {
    clearTimeout(watchdog);
    watchdog = null;
  }
}

type UiStore = {
  isRecording: boolean;
  isDebugOverlayVisible: boolean;
  lastTraceId: string | null;
  /**
   * Synchronous mutex for the assistant's server-bound turns (message,
   * loans consult, greeting, A2UI action, loan confirm). A React state
   * boolean can't guard against two calls in the same tick — both read the
   * stale `false` before a re-render — so the lock is acquired/read through
   * zustand's synchronous `get`/`set` instead.
   */
  turnInFlight: boolean;
  /** When the current turn claimed the lock (for the watchdog), or null. */
  turnStartedAt: number | null;

  setRecording: (value: boolean) => void;
  toggleDebugOverlay: () => void;
  setLastTraceId: (traceId: string) => void;
  /** Returns `false` when a turn is already in flight; otherwise claims it. */
  beginTurn: () => boolean;
  endTurn: () => void;
  /** Force-release the lock (used by the watchdog). */
  resetTurn: () => void;
};

/** Ephemeral, per-device UI state — never anything the backend also owns (see queryClient.ts). */
export const useUiStore = create<UiStore>((set, get) => ({
  isRecording: false,
  isDebugOverlayVisible: false,
  lastTraceId: null,
  turnInFlight: false,
  turnStartedAt: null,

  setRecording: (value) => set({ isRecording: value }),
  toggleDebugOverlay: () => set((s) => ({ isDebugOverlayVisible: !s.isDebugOverlayVisible })),
  setLastTraceId: (traceId) => set({ lastTraceId: traceId }),

  beginTurn: () => {
    const { turnInFlight, turnStartedAt } = get();
    const stale =
      turnInFlight && (turnStartedAt === null || Date.now() - turnStartedAt >= TURN_TIMEOUT_MS);
    if (turnInFlight && !stale) return false;
    if (stale && __DEV__) {
      console.warn('[ui] releasing stale turn lock (watchdog) and reclaiming');
    }
    clearWatchdog();
    set({ turnInFlight: true, turnStartedAt: Date.now() });
    watchdog = setTimeout(() => {
      if (get().turnInFlight) {
        if (__DEV__) console.warn('[ui] turn watchdog fired — releasing a wedged turn lock');
        clearWatchdog();
        set({ turnInFlight: false, turnStartedAt: null });
      }
    }, TURN_TIMEOUT_MS);
    return true;
  },

  endTurn: () => {
    clearWatchdog();
    set({ turnInFlight: false, turnStartedAt: null });
  },

  resetTurn: () => {
    clearWatchdog();
    set({ turnInFlight: false, turnStartedAt: null });
  },
}));
