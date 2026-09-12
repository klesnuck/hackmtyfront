/**
 * Ephemeral draft types for the in-progress transfer wizard (`transfer.store.ts`).
 * Server truth (real accounts, real saved recipients) lives in TanStack Query
 * (`['accounts', userId]`, `['recipients', userId]`) — see design.md's
 * "State split" decision. Nothing here is persisted or hardcoded.
 */

export type TransferMode = 'others' | 'own';

export type TransferDestination =
  | { kind: 'own'; accountId: string; label: string; accountLine: string }
  | {
      kind: 'external';
      alias: string;
      clabe: string;
      bankName: string;
      /** Whether a *new* recipient should be saved on submit. Not set when the
       * destination is an already-saved recipient (nothing new to save). */
      saveRecipient: boolean;
    };

export type TransferResult =
  | { status: 'success'; amount: number; destinationLabel: string; completedAt: number }
  | { status: 'failure'; reason: string; completedAt: number };
