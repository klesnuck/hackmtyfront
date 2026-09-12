import type { Recipient } from './types';

// Account numbers below are valid-format CLABEs (correct mod-10 checksum,
// weights 3-7-1) purely so they'd pass the same validation a real entry
// would — these are mock recipients, not real accounts.
export const INITIAL_RECIPIENTS: Recipient[] = [
  { id: 'r1', nickname: 'Mamá', accountNumber: '002180000118359710' },
  { id: 'r2', nickname: 'Renta depa', accountNumber: '014180001234567897' },
];
