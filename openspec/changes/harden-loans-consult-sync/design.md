## Context

Builds on the deployed `mobile/a2ui-engine` and `mobile/loans-assistant` behavior.
The failure was diagnosed from the backend's own traces: every consult made two
LLM attempts and then failed its A2UI JSON-schema validation, and the client
silently ignored the resulting `status:"error"` payload. See `proposal.md` for the
full evidence.

## Goals / Non-Goals

**Goals:**
- No consult failure is invisible to the user.
- A consult turn answers within ~5 s (server deadline + deterministic fallback;
  client abort slightly later as a backstop).
- Every component the backend emits for a loans terminal renders on device.
- Keep the HTTP/REST contract and `INV-010` intact.

**Non-Goals:**
- Websockets/SSE (explicitly rejected below and forbidden by `INV-010`).
- Streaming partial UI.
- Changing the La Mesa/El Revés paths beyond the shared audio-ref fix.

## Decisions

**1. Fix the contract on both sides, not the transport.** The HTTP exchange
completed correctly (200 + a well-formed error body). Websockets would not make
`action` an object, make `{{...}}` valid on `dynamicNumber`, or make the client
render errors. The transport was never the failure, and both repos declare
`INV-010 — HTTP only. No WebSockets. No SSE.` Migration would be multi-day on both
sides, break the frozen contract, and fix nothing.

**2. Errors are part of the contract, not an edge case.** `loansConsult` returns
`status:'error'` with `error_code`/`message`/`retryable`; the screen maps
`error_code` to Spanish copy, shows `message` as a fallback, and offers retry when
`retryable`. A failed consult must look like a failed turn, never like a frozen
app. `loanConsult.errorMessage` is surfaced for the same reason.

**3. Session identity lives in refs.** `greet()` returns/records the loans session
synchronously; `send()` reads it from a ref. React state updates are async, so the
previous greet-then-send-in-one-handler path could read a stale `sessionId`. Refs
remove the race without moving per-conversation identities into the persistent
store (design.md Decision 4 of `add-loans-consult-flow` stands: they are scoped to
one on-screen conversation).

**4. Implement the components the contract already declares.** The A2UI catalog is
a closed union enforced at compile time, so adding `ScenarioComparison`,
`PlanTable`, `ForecastChart`, `LineChart`, and `BreakAlert` to `BasicNodeType` and
both registries makes "unknown component" impossible for the loans terminal.
Charts use `react-native-svg`, already a dependency. Item shapes follow
`API_KNOWLEDGE.md` §6; the chart helpers accept the key variants observed from
model output (e.g. `value`/`y`/`balance`/`saldo`).

**5. The client timeout is a backstop, not the mechanism.** The backend owns the
5 s guarantee (hard LLM cap + deterministic fallback). The client aborts at ~8 s
so a hung network still resolves to a handled error instead of an infinite
spinner.

**6. Keep audio refs verbatim.** `getAudioAssetUrl` accepts a bare `audio_id` or
the absolute `audio_ref` (`/api/audio/...`) and joins a relative path only when it
is genuinely relative. This removes the class of double-prefix bugs, including the
`/speech.audioRef` path for accessible surfaces.

## Risks / Trade-offs

- **[Risk]** A chart library (react-native-svg) on the new components could look
  inconsistent with existing primitives. → Styled from the shared `theme/tokens`;
  no new visual language.
- **[Risk]** More required components can increase LLM output size and pressure the
  5 s budget. → The backend caps `max_tokens` and falls back deterministically; the
  client timeout is only a backstop.
- **[Trade-off]** With `react-native-svg` charts, web/Expo Go parity is only
  guaranteed in the dev-client build (already required for speech). Acceptable;
  the app already requires a dev client.

## Migration Plan

Additive on the client: new component types and new error/timeout handling; no
existing requirement's observable behavior regresses. Rollback is reverting the
new components and the error branch. Depends on the backend REQ-LM-12/REQ-LM-13
landing first or together.
