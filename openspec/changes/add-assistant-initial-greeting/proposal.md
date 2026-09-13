## Why

Opening the Soporte IA tab starts no turn: the only initial-turn logic was gated on an
`intent` route param, and both real entry points — the bottom-nav tab and the Inicio
banner (`router.push('/asistente')`) — open it with none. So the assistant never speaks
first. The first turn only happened after the user pressed the mic, and by then the
speech-recognition session was active, so the reply's TTS was not audible. (La Mesa TTS
is accessible-only, so this is visible with the `voz-color` persona, e.g. `u_don`.)

A second bug compounded it: the one-shot `hasSentInitialIntent` guard was set before the
`sessionId` check, so a late-hydrated session could permanently swallow the initial turn.

## What Changes

- Add a backend `POST /api/agent/greeting` (`{session_id}` → `AgentResponse` with
  `assistant_text` and, for accessible users only, `audio_ref`) — deterministic, no LLM.
- The Soporte IA tab calls it when it is opened (focused) with an active session, no
  explicit `intent`, and no conversation in progress; it renders `assistant_text` and
  auto-plays `audio_ref` for the `voz-color` catalog. It greets once per session.
- Fix the initial-intent guard so the session is awaited before the one-shot is consumed.
- Reply audio after a spoken turn stays audible (covered by
  `openspec/changes/fix-ios-audio-playback`; this change only ensures the greeting path
  does not depend on the microphone).

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `mobile/assistant`: the tab proactively greets on open (spoken for accessible users),
  once per session, without requiring a user turn.

## Impact

- Backend (separate repo): `agent/service.py` (`greeting`), `api/routers/agent.py` (new),
  `api/schemas.py`, `api/app.py`, REQ-API-12, `API_KNOWLEDGE.md`.
- Frontend: `src/api/endpoints.ts`, `src/api/types.ts`, `app/(tabs)/asistente.tsx`,
  `src/features/voice/audioCache.ts` (playback-mode retry after recognition).
- Depends on / overlaps the still-pending `add-assistant-orb-screen` (its idle screen
  waits for user entry); apply or amend together. Playback-audibility is owned by
  `fix-ios-audio-playback`, so this change does not duplicate the `mobile/voice` delta.
- No new dependency, no invariant change.
