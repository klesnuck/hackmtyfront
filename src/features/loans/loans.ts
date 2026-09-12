import { getLiabilities } from '../../api/endpoints';
import type { Liability } from '../../api/types';

export type LoanStatus = 'on-track' | 'overdue';

export type Loan = {
  /** Same id as the backend liability (amitie/backend/db/schema.sql `liabilities.id`). */
  id: string;
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
};

const CREDITOR_KIND_LABEL: Record<string, string> = {
  credit_card: 'Tarjeta de crédito',
  payroll_loan: 'Préstamo de nómina',
  personal_loan: 'Préstamo personal',
  store_credit: 'Crédito departamental',
};

function mapLiabilityToLoan(liability: Liability): Loan {
  const kindLabel = CREDITOR_KIND_LABEL[liability.kind] ?? liability.kind;
  const progress =
    liability.principal > 0
      ? Math.round(((liability.principal - liability.balance) / liability.principal) * 100)
      : 0;

  return {
    id: liability.id,
    name: `${liability.creditor} · ${kindLabel}`,
    // The backend does not track a "last payment made" date, only a recurring
    // due day (schema.sql `liabilities.due_day`) — there is no real overdue
    // signal to compute client-side, so every active liability reads as
    // on-track rather than fabricating a late status.
    status: 'on-track',
    remainingBalance: liability.balance,
    monthlyPayment: liability.minPayment,
    progressPercent: Math.min(100, Math.max(0, progress)),
    nextPaymentDate: liability.dueDay ? `Día ${liability.dueDay} de cada mes` : 'Sin fecha registrada',
  };
}

/** GET /api/liabilities, mapped to the shape the Préstamos screen renders. Paid-off liabilities drop off the list. */
export async function fetchLoans(userId: string): Promise<Loan[]> {
  const response = await getLiabilities(userId);
  return response.liabilities.filter((item) => item.status === 'active').map(mapLiabilityToLoan);
}
