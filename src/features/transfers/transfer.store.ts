import { create } from 'zustand';
import { OWN_DESTINATION_ACCOUNTS, SOURCE_ACCOUNT } from './mockAccounts';
import { INITIAL_RECIPIENTS } from './mockRecipients';
import type { OwnAccount, Recipient, TransferDestination, TransferResult } from './types';

// The amount-entry step already blocks proceeding when the amount exceeds
// the balance (per spec's "submit action is disabled" scenario), so that
// path can't reach submission in normal use. This random decline is what
// makes the *failure result screen* reachable for a valid-amount transfer —
// standing in for "simulated failure, network error, etc." per the spec's
// result-state requirement, without needing a real backend.
const SIMULATED_DECLINE_RATE = 0.25;
const SIMULATED_LATENCY_MS = 700;

type TransferState = {
  sourceAccount: OwnAccount;
  sourceBalance: number;
  ownDestinations: OwnAccount[];
  recipients: Recipient[];

  destination: TransferDestination | null;
  amount: number | null;
  isSubmitting: boolean;
  result: TransferResult | null;

  selectDestination: (destination: TransferDestination) => void;
  addRecipient: (recipient: Recipient) => void;
  setAmount: (amount: number | null) => void;
  submitTransfer: () => Promise<void>;
  resetFlow: () => void;
};

export const useTransferStore = create<TransferState>((set, get) => ({
  sourceAccount: SOURCE_ACCOUNT,
  sourceBalance: SOURCE_ACCOUNT.balance,
  ownDestinations: OWN_DESTINATION_ACCOUNTS,
  recipients: [...INITIAL_RECIPIENTS],

  destination: null,
  amount: null,
  isSubmitting: false,
  result: null,

  selectDestination: (destination) => set({ destination }),

  addRecipient: (recipient) => set((s) => ({ recipients: [...s.recipients, recipient] })),

  setAmount: (amount) => set({ amount }),

  submitTransfer: () =>
    new Promise<void>((resolve) => {
      const { destination, amount, sourceBalance } = get();
      if (!destination || amount === null) {
        resolve();
        return;
      }

      set({ isSubmitting: true });

      setTimeout(() => {
        const destinationLabel =
          destination.kind === 'own' ? destination.account.label : destination.recipient.nickname;
        const insufficientFunds = amount > sourceBalance;
        const simulatedDecline = !insufficientFunds && Math.random() < SIMULATED_DECLINE_RATE;

        if (insufficientFunds || simulatedDecline) {
          set({
            isSubmitting: false,
            result: {
              status: 'failure',
              reason: insufficientFunds
                ? 'Fondos insuficientes en tu cuenta de origen.'
                : 'No pudimos completar tu transferencia. Intenta de nuevo.',
              amount,
              destinationLabel,
              completedAt: Date.now(),
            },
          });
          resolve();
          return;
        }

        set({
          isSubmitting: false,
          sourceBalance: sourceBalance - amount,
          result: { status: 'success', amount, destinationLabel, completedAt: Date.now() },
        });
        resolve();
      }, SIMULATED_LATENCY_MS);
    }),

  resetFlow: () => set({ destination: null, amount: null, result: null }),
}));
