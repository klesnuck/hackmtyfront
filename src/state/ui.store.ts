import { create } from 'zustand';

type UiStore = {
  isRecording: boolean;
  isDebugOverlayVisible: boolean;
  lastTraceId: string | null;

  setRecording: (value: boolean) => void;
  toggleDebugOverlay: () => void;
  setLastTraceId: (traceId: string) => void;
};

/** Ephemeral, per-device UI state — never anything the backend also owns (see queryClient.ts). */
export const useUiStore = create<UiStore>((set) => ({
  isRecording: false,
  isDebugOverlayVisible: false,
  lastTraceId: null,

  setRecording: (value) => set({ isRecording: value }),
  toggleDebugOverlay: () => set((s) => ({ isDebugOverlayVisible: !s.isDebugOverlayVisible })),
  setLastTraceId: (traceId) => set({ lastTraceId: traceId }),
}));
