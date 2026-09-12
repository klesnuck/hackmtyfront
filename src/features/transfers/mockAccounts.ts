import type { OwnAccount } from './types';

/**
 * Mock balance state for this flow only, self-contained on purpose: the
 * dashboard's own balance card (`src/features/dashboard/mockAccount.ts`)
 * belongs to a different lane building in parallel. Wiring the two together
 * — so a transfer here actually moves the number the dashboard shows — is a
 * small follow-up once both lanes have landed.
 */
export const SOURCE_ACCOUNT: OwnAccount = {
  id: 'source-checking',
  label: 'Cuenta de cheques',
  maskedNumber: '**** 4821',
  balance: 18452.3,
};

export const OWN_DESTINATION_ACCOUNTS: OwnAccount[] = [
  { id: 'own-savings', label: 'Cuenta de ahorro', maskedNumber: '**** 7734', balance: 5200 },
  { id: 'own-nomina', label: 'Cuenta nómina', maskedNumber: '**** 1190', balance: 900 },
];
