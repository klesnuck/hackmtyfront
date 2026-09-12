/**
 * TODO(add-navigation-and-dashboard): remove once a real account/balance
 * endpoint exists. SPECS.md §8's frozen contract has no "account" resource
 * yet — the Inicio balance card renders this fixed object until backend
 * coordination adds one (see the change's proposal.md "Impact" section).
 */
export type MockAccount = {
  bankName: string;
  maskedAccountNumber: string;
  balance: number;
  currency: string;
  clabe: string;
};

export const MOCK_ACCOUNT: MockAccount = {
  bankName: 'Mi Cuenta Banorte',
  maskedAccountNumber: '*7843',
  balance: 45230.5,
  currency: 'MXN',
  clabe: '072 180 0045 2305 0123',
};

/** Formats the balance the way the Figma reference shows it: no currency symbol from Intl (that's rendered as a separate "MXN" label). */
export function formatBalance(amount: number): string {
  return `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
