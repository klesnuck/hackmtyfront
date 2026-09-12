import { create } from 'zustand';
import type { TransferDestination, TransferMode, TransferResult } from './types';

/**
 * Holds only the ephemeral, non-persisted draft for the in-progress transfer
 * wizard (mode, source account, destination, amount, motivo, result). Real
 * accounts and saved recipients are server data read through TanStack Query
 * (`['accounts', userId]`, `['recipients', userId]`) — never store state — so
 * this store no longer hardcodes `ownDestinations`/`recipients`/`sourceBalance`
 * (design.md's "State split" decision). Submission itself is a `useMutation`
 * in `confirmar.tsx` (same pattern as `AbonoModal`), not store logic.
 */
type TransferState = {
  mode: TransferMode | null;
  sourceAccountId: string | null;
  destination: TransferDestination | null;
  amount: number | null;
  motivo: string;
  result: TransferResult | null;

  selectMode: (mode: TransferMode) => void;
  selectSource: (accountId: string) => void;
  selectDestination: (destination: TransferDestination) => void;
  setAmount: (amount: number | null) => void;
  setMotivo: (motivo: string) => void;
  setResult: (result: TransferResult | null) => void;
  resetFlow: () => void;
};

const draftInitialState = {
  sourceAccountId: null,
  destination: null,
  amount: null,
  motivo: '',
  result: null,
} satisfies Partial<TransferState>;

export const useTransferStore = create<TransferState>((set) => ({
  mode: null,
  ...draftInitialState,

  // Switching tabs discards any in-progress destination/amount from the
  // previous tab (spec's "Switching modes preserves nothing sensitive").
  selectMode: (mode) => set({ ...draftInitialState, mode }),

  selectSource: (accountId) => set({ sourceAccountId: accountId }),

  selectDestination: (destination) => set({ destination }),

  setAmount: (amount) => set({ amount }),

  setMotivo: (motivo) => set({ motivo }),

  setResult: (result) => set({ result }),

  resetFlow: () => set({ mode: null, ...draftInitialState }),
}));
