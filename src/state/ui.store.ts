import { create } from 'zustand';

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

  setRecording: (value: boolean) => void;
  toggleDebugOverlay: () => void;
  setLastTraceId: (traceId: string) => void;
  /** Returns `false` when a turn is already in flight; otherwise claims it. */
  beginTurn: () => boolean;
  endTurn: () => void;
};

/** Ephemeral, per-device UI state — never anything the backend also owns (see queryClient.ts). */
export const useUiStore = create<UiStore>((set, get) => ({
  isRecording: false,
  isDebugOverlayVisible: false,
  lastTraceId: null,
  turnInFlight: false,

  setRecording: (value) => set({ isRecording: value }),
  toggleDebugOverlay: () => set((s) => ({ isDebugOverlayVisible: !s.isDebugOverlayVisible })),
  setLastTraceId: (traceId) => set({ lastTraceId: traceId }),
  beginTurn: () => {
    if (get().turnInFlight) return false;
    set({ turnInFlight: true });
    return true;
  },
  endTurn: () => set({ turnInFlight: false }),
}));
