const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
});

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}
