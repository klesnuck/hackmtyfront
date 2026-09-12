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
  /** Present when the account has an accessibility flag — drives REQ-ACC-01/02. */
  accessibility_profile?: {
    elderly?: boolean;
    blind?: boolean;
    low_literacy?: boolean;
    other?: boolean;
  } | null;
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
