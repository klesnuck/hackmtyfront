import { listLoans } from '../../api/endpoints';
import type { LoanListItem } from '../../api/types';

export type LoanStatus = 'on-track' | 'overdue';

export type LoanSource = 'loan' | 'liability';

export type Loan = {
  /** Same id as the backend `loans.id` (created loan) or `liabilities.id`. */
  id: string;
  /** Which backend record this row is; loan rows open the personalized detail page. */
  source: LoanSource;
  name: string;
  status: LoanStatus;
  /** Only meaningful when status is 'overdue', e.g. "5 días de atraso". */
  overdueLabel?: string;
  remainingBalance: number;
  /** Suggested "Abonar" amount — the liability's contractual minimum payment. */
  monthlyPayment: number;
  /** 0-100, share of principal already paid off. */
  progressPercent: number;
  /** Pre-formatted for display (e.g. "Día 5 de cada mes") — no date math needed client-side. */
  nextPaymentDate: string;
  /** Why the user wanted the credit (null for liabilities or private reasons). */
  purpose: string | null;
};

function mapItem(item: LoanListItem): Loan {
  const isLoan = item.source === 'loan';
  let nextPaymentDate = 'Sin fecha registrada';
  if (item.dueDay) {
    nextPaymentDate = `Día ${item.dueDay} de cada mes`;
  } else if (isLoan) {
    nextPaymentDate = 'Día 5 de cada mes';
  }

  return {
    id: item.id,
    source: item.source,
    name: item.name,
    // The backend does not track a "last payment made" date, so nothing is
    // fabricated as late; every active record reads as on-track.
    status: 'on-track',
    remainingBalance: item.balance,
    monthlyPayment: item.monthlyPayment,
    progressPercent: Math.min(100, Math.max(0, item.progressPercent)),
    nextPaymentDate,
    purpose: item.purpose,
  };
}

/** GET /api/loans — created loans + active liabilities in one list. */
export async function fetchLoans(userId: string): Promise<Loan[]> {
  const response = await listLoans(userId);
  return response.items.map(mapItem);
}
