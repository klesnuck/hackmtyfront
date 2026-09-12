import { apiRequest } from './client';
import type {
  ActionRequest,
  ActionResponse,
  CreateSavingBagRequest,
  KillTestResponse,
  MessageRequest,
  NegotiationTurnRequest,
  NegotiationTurnResponse,
  SavingBagResponse,
  SessionResponse,
  SurfaceResponse,
  UiResponse,
} from './types';

/**
 * One function per REQ-API-* endpoint (SPECS.md §8). Nothing outside this
 * file should import `apiRequest`/`fetch` directly — that's what keeps the
 * "frozen contract" (INV-023) enforceable as a one-file diff.
 */

// REQ-API-01
export function createSession(): Promise<SessionResponse> {
  return apiRequest<SessionResponse>('/api/session', { method: 'POST', body: {} });
}

// REQ-API-02
export function sendMessage(request: MessageRequest): Promise<SurfaceResponse> {
  return apiRequest<SurfaceResponse>('/api/message', { method: 'POST', body: request });
}

// REQ-API-03
export function sendAction(request: ActionRequest): Promise<ActionResponse> {
  return apiRequest<ActionResponse>('/api/action', { method: 'POST', body: request });
}

// REQ-API-04
export function getSurface(surfaceId: string): Promise<UiResponse> {
  return apiRequest<UiResponse>(`/api/ui/${encodeURIComponent(surfaceId)}`);
}

// REQ-API-07 — returns a playable URL, not JSON; see features/voice.
export function getAudioAssetUrl(assetId: string, baseUrl: string): string {
  return `${baseUrl}/api/audio/${encodeURIComponent(assetId)}`;
}

// REQ-API-08
export function getKillTest(surfaceId: string): Promise<KillTestResponse> {
  return apiRequest<KillTestResponse>(`/debug/kill-test/${encodeURIComponent(surfaceId)}`);
}

// --- Below: shapes are INFERRED (src/api/types.ts) — confirm with the backend team ---

// REQ-API-05
export function createSavingBag(request: CreateSavingBagRequest): Promise<SavingBagResponse> {
  return apiRequest<SavingBagResponse>('/api/saving-bags', { method: 'POST', body: request });
}
export function listSavingBags(): Promise<SavingBagResponse[]> {
  return apiRequest<SavingBagResponse[]>('/api/saving-bags');
}
export function getSavingBag(bagId: string): Promise<SavingBagResponse> {
  return apiRequest<SavingBagResponse>(`/api/saving-bags/${encodeURIComponent(bagId)}`);
}
export function answerSavingBagQuestion(
  bagId: string,
  request: Record<string, unknown>,
): Promise<SavingBagResponse> {
  return apiRequest<SavingBagResponse>(`/api/saving-bags/${encodeURIComponent(bagId)}/answer`, {
    method: 'POST',
    body: request,
  });
}
export function refreshSavingBag(bagId: string): Promise<SavingBagResponse> {
  return apiRequest<SavingBagResponse>(`/api/saving-bags/${encodeURIComponent(bagId)}/refresh`, {
    method: 'POST',
    body: {},
  });
}

// REQ-API-06
export function negotiationTurn(session: string, request: NegotiationTurnRequest): Promise<NegotiationTurnResponse> {
  return apiRequest<NegotiationTurnResponse>(`/api/negotiation/${encodeURIComponent(session)}/turn`, {
    method: 'POST',
    body: request,
  });
}
export function negotiationTakeControl(session: string): Promise<NegotiationTurnResponse> {
  return apiRequest<NegotiationTurnResponse>(`/api/negotiation/${encodeURIComponent(session)}/take-control`, {
    method: 'POST',
    body: {},
  });
}
