/**
 * Fixed bank picker for the "banco" field (design.md non-goal: no CLABE
 * bank-code-prefix auto-detection/lookup table — the user asked for a
 * "banco" field, and this fixed list satisfies that directly).
 */
export const BANK_OPTIONS = [
  'BBVA',
  'Banorte',
  'Santander',
  'Citibanamex',
  'HSBC',
  'Scotiabank',
  'Otro',
] as const;

export type BankOption = (typeof BANK_OPTIONS)[number];
