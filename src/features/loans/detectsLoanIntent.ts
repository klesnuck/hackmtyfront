/**
 * Client-side loan-intent heuristic (design.md Decision 2).
 *
 * Checks whether a user's first message in a fresh conversation looks like
 * a loan request. Deliberately narrow — false negatives default to the
 * existing La Mesa path (safe), false positives would enter the wrong flow.
 */

const LOAN_KEYWORDS: string[] = [
  'préstamo',
  'prestamo',
  'crédito',
  'credito',
  'pedir prestado',
  'pedir dinero prestado',
  'financiar',
  'financiamiento',
  'necesito dinero',
  'quiero un crédito',
  'quiero un credito',
  'quiero un préstamo',
  'quiero un prestamo',
  'solicitar un préstamo',
  'solicitar un prestamo',
  'solicitar un crédito',
  'solicitar un credito',
  'pedir un préstamo',
  'pedir un prestamo',
  'pedir un crédito',
  'pedir un credito',
];

export function detectsLoanIntent(text: string): boolean {
  const normalized = text.toLowerCase().trim();
  return LOAN_KEYWORDS.some((kw) => normalized.includes(kw));
}
