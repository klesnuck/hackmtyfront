/** Formats a balance the way the Figma reference shows it: no currency symbol from Intl (that's rendered as a separate "MXN" label). */
export function formatBalance(amount: number): string {
  return `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const ACCOUNT_KIND_LABEL: Record<string, string> = {
  checking: 'Cuenta de cheques',
  savings: 'Cuenta de ahorro',
};

export function formatAccountKind(kind: string): string {
  return ACCOUNT_KIND_LABEL[kind] ?? kind;
}
