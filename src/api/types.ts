/**
 * REST wire types for the backend's frozen contract (SPECS.md §8). snake_case
 * on purpose — this is a Python/FastAPI/Pydantic API. Do not rename these to
 * camelCase; `src/a2ui/types.ts` is where camelCase (the A2UI protocol's own
 * casing) belongs. Endpoints beyond session/message/action/ui/audio have their
 * response shape marked INFERRED — SPECS.md §8 names the endpoint and request
 * body but not the full response; confirm with the backend team before relying
 * on exact field names (MOBILE_ARCHITECTURE.md §11).
 */

import type { A2UIMessage } from '../a2ui/types';

export type SessionResponse = {
  session_id: string;
  user_id: string;
};

// --- Plain-REST auth endpoint (amitie/backend/api/routers/auth.py) ---
// Not part of the original §8 A2UI contract; added for the native login
// screen's real credential check (SPECS.md §12, backend repo).

export type LoginRequest = { username: string; password: string };

export type LoginResponse = {
  session_id: string;
  user_id: string;
  username: string;
  accessibility_mode: string | null;
};

export type MessageRequest =
  | { session_id: string; text: string }
  | { session_id: string; audio_b64: string };

export type SurfaceResponse = {
  a2ui: A2UIMessage[];
  surface_id: string;
  audio_ref?: string | null;
};

export type ActionRequest = {
  surface_id: string;
  name: string;
  source_component_id: string;
  context: Record<string, unknown>;
};

export type ActionResponse = {
  a2ui: A2UIMessage[];
};

export type UiResponse = {
  a2ui: A2UIMessage[];
};

export type KillTestResponse = {
  a2ui: A2UIMessage[];
  surface_id: string;
};

// --- INFERRED response shapes below — confirm against the backend before shipping ---

/** INFERRED: REQ-API-05, POST /api/saving-bags */
export type CreateSavingBagRequest = { session_id: string; name: string };
/** INFERRED */
export type SavingBagResponse = SurfaceResponse & { bag_id: string };

/** INFERRED: REQ-API-06, negotiation turn/take-control */
export type NegotiationTurnRequest = { session_id: string; context?: Record<string, unknown> };
/** INFERRED */
export type NegotiationTurnResponse = SurfaceResponse;

// --- Plain-REST finance endpoints (amitie/backend/api/routers/finance.py) ---
// Not part of SPECS.md §8's original frozen contract (that's A2UI-only); added
// alongside it for screens that render their own native UI (inicio, prestamos)
// instead of a generated surface. Field casing is camelCase inside the nested
// domain objects because it mirrors the MCP `finance` tool payload shape
// (mcp_servers/finance/service.py), not the outer snake_case request envelope.

export type Profile = {
  id: string;
  name: string;
  age: number | null;
  city: string | null;
  monthlyIncome: number | null;
  payFrequency: string | null;
  creditScore: number | null;
  accessibilityMode: string | null;
};

export type ProfileResponse = { profile: Profile | null };

export type Account = {
  id: string;
  userId: string;
  kind: string;
  institution: string | null;
  balance: number;
  currency: string;
};

export type AccountsResponse = { accounts: Account[] };

export type Liability = {
  id: string;
  creditor: string;
  kind: string;
  principal: number;
  balance: number;
  apr: number;
  minPayment: number;
  dueDay: number | null;
  nominaDiscount: number;
  status: 'active' | 'paid' | string;
};

export type LiabilitiesResponse = {
  liabilities: Liability[];
  total_debt: number;
  total_min_payment: number;
};

export type PaymentRequest = { user_id: string; amount: number; account_id?: string | null };

export type PaymentResponse = {
  status: 'ok' | 'error';
  applied_amount: number;
  liability: Liability | null;
  account: Account | null;
  transaction: {
    id: string;
    accountId: string;
    occurredOn: string;
    amount: number;
    direction: 'out';
    category: string;
    merchant: string;
  } | null;
  issues: string[];
};

// --- Plain-REST transfers endpoints (amitie/backend/api/routers/finance.py) ---
// New alongside recipients/transfers (SPECS.md §13, REQ-XFER-01..04). Same
// casing convention as the rest of this section: snake_case request envelope,
// camelCase inside nested domain objects (mirrors the `finance` MCP tool
// payload shape).

export type Recipient = {
  id: string;
  alias: string;
  clabe: string;
  bankName: string;
  createdAt: string;
};

export type RecipientsResponse = { recipients: Recipient[] };

export type RecipientCreateRequest = {
  user_id: string;
  alias: string;
  clabe: string;
  bank_name: string;
};

export type RecipientResponse = {
  status: 'ok' | 'error';
  recipient: Recipient | null;
  issues: string[];
};

export type TransferDestination =
  | { kind: 'own'; account_id: string }
  | { kind: 'external'; clabe: string; bank_name: string; alias?: string; save_recipient?: boolean };

export type TransferRequest = {
  user_id: string;
  source_account_id: string;
  amount: number;
  memo: string;
  destination: TransferDestination;
};

export type TransferResponse = {
  status: 'ok' | 'error';
  transfer: {
    id: string;
    amount: number;
    memo: string;
    occurredOn: string;
    kind: 'own' | 'external';
  } | null;
  source_account: Account | null;
  destination_account: Account | null;
  saved_recipient: Recipient | null;
  issues: string[];
};

// --- Loans & Credits consult (API_KNOWLEDGE.md §6) ---
// A2UIMessage already imported above (line 11).

export type LoansGreetingPayload = {
  status: 'ok' | 'error';
  session_id: string;
  response_text: string;
  audio_id: string | null;
  audio_ref: string | null;
  terminal_response: null;
};

export type LoansConsultPayload = {
  status: 'ok' | 'error';
  loan_request_id: string;
  response_text: string;
  confidence: number;
  audio_id: string | null;
  audio_ref: string | null;
  /** Present only when status === 'error'. */
  error_code?: string | null;
  message?: string | null;
  retryable?: boolean;
  terminal_response: {
    catalog_id: string;
    surface_id: string;
    a2ui: A2UIMessage[];
  } | null;
};

export type LoansConsultRequest = {
  session_id: string;
  text?: string;
  audio_b64?: string;
  language?: string;
  loan_request_id?: string | null;
};

export type LoanScheduleRow = {
  month: number;
  payment: number;
  interest: number;
  principal: number;
  balance: number;
};

export type LoanTerms = {
  amount: number;
  apr: number;
  termMonths: number;
  monthlyPayment: number;
  totalInterest: number;
  totalCost: number;
  cat: number;
  openingFee?: number;
  insuranceFee?: number;
  schedule: LoanScheduleRow[];
};

export type LoanRisk = {
  dti: { existing: number | null; withOffer: number | null; cap: number; flag: boolean };
  surplus: { monthly: number; discretionarySpend: number; subscriptions: number; minPayment: number };
  liquidityBufferMonths: number | null;
  relativeCost: { offeredApr: number; worstExistingApr: number; aprFloor: number; worse: boolean };
  incomeStability: { coefficientOfVariation: number; flag: boolean };
  payrollDeduction: { applied: boolean; netPerPeriod: number | null };
  savingsImpact: {
    goal: string;
    monthsBefore: number | null;
    monthsAfter: number | null;
    delayedMonths: number | null;
  } | null;
  paymentHistory: {
    available: boolean;
    onTimeRatio?: number;
    late?: number;
    missed?: number;
    projectedScoreDelta: number;
  };
};

export type LoansCreateRequest = {
  user_id: string;
  amount: number;
  months?: number;
  loan_request_id?: string;
};

export type LoanResponse = {
  status: 'ok' | 'error';
  loan: (LoanTerms & { id: string; userId: string }) | null;
  issues?: string[];
};

