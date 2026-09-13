import { apiRequest } from './client';
import type {
  AccountsResponse,
  ActionRequest,
  ActionResponse,
  AgentGreetingResponse,
  CreateSavingBagRequest,
  KillTestResponse,
  LiabilitiesResponse,
  LoginRequest,
  LoginResponse,
  MessageRequest,
  NegotiationTurnRequest,
  NegotiationTurnResponse,
  PaymentRequest,
  PaymentResponse,
  ProfileResponse,
  RecipientCreateRequest,
  RecipientResponse,
  RecipientsResponse,
  SavingBagResponse,
  SessionResponse,
  SurfaceResponse,
  TransferRequest,
  TransferResponse,
  UiResponse,
} from './types';

/**
 * One function per REQ-API-* endpoint (SPECS.md §8). Nothing outside this
 * file should import `apiRequest`/`fetch` directly — that's what keeps the
 * "frozen contract" (INV-023) enforceable as a one-file diff.
 */

// REQ-API-01
export function createSession(userId: string): Promise<SessionResponse> {
  return apiRequest<SessionResponse>('api/session', { method: 'POST', body: { user_id: userId } });
}

/** Real credential check — POST /api/login (amitie/backend/api/routers/auth.py, SPECS.md §12). */
export function login(request: LoginRequest): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('api/login', { method: 'POST', body: request });
}

// REQ-API-02
// The agent can chain up to 12 sequential model calls per turn (tool use loop,
// amitie/backend/agent/service.py) — observed turns take 20-40s+. The client
// default (15s, src/api/client.ts) is tuned for plain CRUD calls and aborts
// well before the backend finishes, which iOS/Expo then reports as a
// misleading native error instead of a clean timeout.
const AGENT_MESSAGE_TIMEOUT_MS = 60_000;

export function sendMessage(request: MessageRequest): Promise<SurfaceResponse> {
  return apiRequest<SurfaceResponse>('api/message', {
    method: 'POST',
    body: request,
    timeoutMs: AGENT_MESSAGE_TIMEOUT_MS,
  });
}

// REQ-API-12 — deterministic spoken greeting for the Asistente tab (no LLM).
export function agentGreeting(sessionId: string): Promise<AgentGreetingResponse> {
  return apiRequest<AgentGreetingResponse>('api/agent/greeting', {
    method: 'POST',
    body: { session_id: sessionId },
  });
}

// REQ-API-03
export function sendAction(request: ActionRequest): Promise<ActionResponse> {
  return apiRequest<ActionResponse>('api/action', { method: 'POST', body: request });
}

// REQ-API-04
export function getSurface(surfaceId: string): Promise<UiResponse> {
  return apiRequest<UiResponse>(`api/ui/${encodeURIComponent(surfaceId)}`);
}

// REQ-API-07 — returns a playable URL, not JSON; see features/voice.
// Accepts either a bare asset id (`aud_…`) or the backend's absolute
// `audio_ref` (`/api/audio/aud_…`) — never prepend `/api/audio/` twice.
export function getAudioAssetUrl(assetId: string, baseUrl: string): string {
  const ref = assetId.trim();
  if (ref.startsWith('http://') || ref.startsWith('https://')) return ref;
  const origin = (baseUrl || getApiBaseUrl()).replace(/\/+$/, '');
  if (ref.startsWith('/')) return `${origin}${ref}`;
  const id = ref.startsWith('api/audio/') ? ref.slice('api/audio/'.length) : ref;
  return `${origin}/api/audio/${encodeURIComponent(id)}`;
}

// REQ-API-08
export function getKillTest(surfaceId: string): Promise<KillTestResponse> {
  return apiRequest<KillTestResponse>(`/debug/kill-test/${encodeURIComponent(surfaceId)}`);
}

// --- Below: shapes are INFERRED (src/api/types.ts) — confirm with the backend team ---

// REQ-API-05
export function createSavingBag(request: CreateSavingBagRequest): Promise<SavingBagResponse> {
  return apiRequest<SavingBagResponse>('api/saving-bags', { method: 'POST', body: request });
}
export function listSavingBags(): Promise<SavingBagResponse[]> {
  return apiRequest<SavingBagResponse[]>('api/saving-bags');
}
export function getSavingBag(bagId: string): Promise<SavingBagResponse> {
  return apiRequest<SavingBagResponse>(`api/saving-bags/${encodeURIComponent(bagId)}`);
}
export function answerSavingBagQuestion(
  bagId: string,
  request: Record<string, unknown>,
): Promise<SavingBagResponse> {
  return apiRequest<SavingBagResponse>(`api/saving-bags/${encodeURIComponent(bagId)}/answer`, {
    method: 'POST',
    body: request,
  });
}
export function refreshSavingBag(bagId: string): Promise<SavingBagResponse> {
  return apiRequest<SavingBagResponse>(`api/saving-bags/${encodeURIComponent(bagId)}/refresh`, {
    method: 'POST',
    body: {},
  });
}

// REQ-API-06
export function negotiationTurn(session: string, request: NegotiationTurnRequest): Promise<NegotiationTurnResponse> {
  return apiRequest<NegotiationTurnResponse>(`api/negotiation/${encodeURIComponent(session)}/turn`, {
    method: 'POST',
    body: request,
  });
}
export function negotiationTakeControl(session: string): Promise<NegotiationTurnResponse> {
  return apiRequest<NegotiationTurnResponse>(`api/negotiation/${encodeURIComponent(session)}/take-control`, {
    method: 'POST',
    body: {},
  });
}

// --- Plain-REST finance endpoints (amitie/backend/api/routers/finance.py) ---

export function getProfile(userId: string): Promise<ProfileResponse> {
  return apiRequest<ProfileResponse>(`api/profile?user_id=${encodeURIComponent(userId)}`);
}

export function getAccounts(userId: string): Promise<AccountsResponse> {
  return apiRequest<AccountsResponse>(`api/accounts?user_id=${encodeURIComponent(userId)}`);
}

export function getLiabilities(userId: string): Promise<LiabilitiesResponse> {
  return apiRequest<LiabilitiesResponse>(`api/liabilities?user_id=${encodeURIComponent(userId)}`);
}

/** "Abonar" — applies a real payment against a liability (moves account balance, records a transaction). */
export function payLiability(liabilityId: string, request: PaymentRequest): Promise<PaymentResponse> {
  return apiRequest<PaymentResponse>(`api/liabilities/${encodeURIComponent(liabilityId)}/payment`, {
    method: 'POST',
    body: request,
  });
}

export function getRecipients(userId: string): Promise<RecipientsResponse> {
  return apiRequest<RecipientsResponse>(`api/recipients?user_id=${encodeURIComponent(userId)}`);
}

export function createRecipient(request: RecipientCreateRequest): Promise<RecipientResponse> {
  return apiRequest<RecipientResponse>('api/recipients', { method: 'POST', body: request });
}

/** Real transfer submission — moves persisted money out of the source account (`POST /api/transfers`). */
export function submitTransfer(request: TransferRequest): Promise<TransferResponse> {
  return apiRequest<TransferResponse>('api/transfers', { method: 'POST', body: request });
}

// --- Loans & Credits consult (API_KNOWLEDGE.md §6) ---

import { parseMultipartJsonPart } from './multipart';
import { getApiBaseUrl } from './baseUrl';
import type {
  LoanDetailResponse,
  LoanResponse,
  LoansConsultPayload,
  LoansConsultRequest,
  LoansCreateRequest,
  LoansGreetingPayload,
  LoansListResponse,
} from './types';

/** The configured backend origin, normalized (no trailing slash). Single source of truth. */
export { getApiBaseUrl };

/** Resolve a relative API path (e.g. `/api/audio/aud_…`) against the backend origin. */
export function resolveApiUrl(pathOrUrl: string): string {
  const value = pathOrUrl.trim();
  if (/^https?:\/\//i.test(value)) return value;
  return value.startsWith('/') ? `${getApiBaseUrl()}${value}` : `${getApiBaseUrl()}/${value}`;
}

/** Server LLM budget is ~6.5s + TTS; abort later so the fallback still arrives. */
const LOANS_TIMEOUT_MS = 12000;

async function loansFetch(path: string, body: unknown): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LOANS_TIMEOUT_MS);
  try {
    return await fetch(`${getApiBaseUrl()}/${path.replace(/^\/+/, '')}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if ((err as { name?: string }).name === 'AbortError') {
      throw new Error('La consulta tardó demasiado. Intenta de nuevo.');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

/** POST /api/loans/greeting — multipart response (payload JSON + optional audio). */
export async function loansGreeting(userId: string): Promise<LoansGreetingPayload> {
  const response = await loansFetch('api/loans/greeting', { user_id: userId });
  if (!response.ok) {
    throw new Error(`loansGreeting failed: ${response.status}`);
  }
  const payload = await parseMultipartJsonPart<LoansGreetingPayload>(response, 'payload');
  if (!payload) throw new Error('loansGreeting: could not parse payload part');
  return payload;
}

/** POST /api/loans/consult — multipart response (payload JSON + optional audio). */
export async function loansConsult(request: LoansConsultRequest): Promise<LoansConsultPayload> {
  const response = await loansFetch('api/loans/consult', request);
  if (!response.ok) {
    throw new Error(`loansConsult failed: ${response.status}`);
  }
  const payload = await parseMultipartJsonPart<LoansConsultPayload>(response, 'payload');
  if (!payload) throw new Error('loansConsult: could not parse payload part');
  return payload;
}

/** POST /api/loans — create + disburse a loan (manual, irreversible). */
export function createLoan(request: LoansCreateRequest): Promise<LoanResponse> {
  return apiRequest<LoanResponse>('api/loans', { method: 'POST', body: request });
}

/** GET /api/loans/{loan_request_id} — hydrated terminal consult (JSON). */
export function getLoanRequest(loanRequestId: string): Promise<LoansConsultPayload> {
  return apiRequest<LoansConsultPayload>(`api/loans/${encodeURIComponent(loanRequestId)}`);
}

/** GET /api/loans?user_id= — one list of created loans + active liabilities. */
export function listLoans(userId: string): Promise<LoansListResponse> {
  return apiRequest<LoansListResponse>(`api/loans?user_id=${encodeURIComponent(userId)}`);
}

/** GET /api/loans/{loan_id}/ui — personalized per-loan A2UI page (create-or-hydrate). */
export function getLoanDetail(loanId: string, userId: string): Promise<LoanDetailResponse> {
  return apiRequest<LoanDetailResponse>(
    `api/loans/${encodeURIComponent(loanId)}/ui?user_id=${encodeURIComponent(userId)}`,
  );
}

/** GET /api/liabilities/{liability_id}/ui — personalized per-liability A2UI page. */
export function getLiabilityDetail(
  liabilityId: string,
  userId: string,
): Promise<LoanDetailResponse> {
  return apiRequest<LoanDetailResponse>(
    `/api/liabilities/${encodeURIComponent(liabilityId)}/ui?user_id=${encodeURIComponent(userId)}`,
  );
}

