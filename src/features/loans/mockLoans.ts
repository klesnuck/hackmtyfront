/**
 * TODO(add-loans-management): remove this whole file once GET /api/loans
 * (INFERRED — see openspec/changes/add-loans-management/design.md, the
 * backend team has not confirmed this shape yet) is available. Mirrors the
 * mockAccounts.ts pattern (src/features/session/mockAccounts.ts): this app
 * has no loans resource yet, so the Préstamos list renders against this
 * fixed set until the backend contract lands.
 */

export type LoanStatus = 'on-track' | 'overdue';

export type Loan = {
  id: string;
  name: string;
  status: LoanStatus;
  /** Only meaningful when status is 'overdue', e.g. "5 días de atraso". */
  overdueLabel?: string;
  remainingBalance: number;
  monthlyPayment: number;
  /** 0-100, share of principal already paid off. */
  progressPercent: number;
  /** Pre-formatted for display (e.g. "15 Abr, 2026") — no date math needed client-side. */
  nextPaymentDate: string;
};

const MOCK_LOANS: Loan[] = [
  {
    id: 'loan-personal-1',
    name: 'Préstamo Personal',
    status: 'on-track',
    remainingBalance: 15400,
    monthlyPayment: 1200,
    progressPercent: 65,
    nextPaymentDate: '15 Abr, 2026',
  },
  {
    id: 'loan-auto-1',
    name: 'Préstamo Automotriz',
    status: 'overdue',
    overdueLabel: '5 días de atraso',
    remainingBalance: 92500,
    monthlyPayment: 4500,
    progressPercent: 48,
    nextPaymentDate: '2 Mar, 2026',
  },
  {
    id: 'loan-hipotecario-1',
    name: 'Crédito Hipotecario',
    status: 'on-track',
    remainingBalance: 174000,
    monthlyPayment: 14200,
    progressPercent: 88,
    nextPaymentDate: '30 Abr, 2026',
  },
];

const MOCK_FETCH_DELAY_MS = 400;

/**
 * Stands in for a real GET /api/loans call. The artificial delay exercises
 * TanStack Query's loading state the same way a real fetch would, without
 * pointing at any endpoint (this pass is UI-only, see tasks.md §1).
 */
export function fetchMockLoans(): Promise<Loan[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_LOANS), MOCK_FETCH_DELAY_MS);
  });
}
