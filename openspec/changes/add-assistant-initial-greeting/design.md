## Context

The Asistente tab (`app/(tabs)/asistente.tsx`) is reached from the bottom tab bar and
from the Inicio banner, both with no `intent` param. Its initial-turn effect only ran for
`intent` routes, and its one-shot guard was consumed before `sessionId` was available.
Backend has no La Mesa greeting (only `/api/loans/greeting`); TTS is accessible-only
(`SpeechEnricher` only enriches `voz-color` surfaces).

## Goals / Non-Goals

**Goals:**
- The tab speaks a greeting on open for accessible users, without using the microphone.
- The greeting is deterministic and fast (no LLM), so it plays immediately.
- It does not fire when an explicit intent already starts the conversation.

**Non-Goals:**
- Changing the idle orb screen design (owned by `add-assistant-orb-screen`).
- Producing a full generated surface for the greeting (it is text + audio only).
- Re-specifying playback session handling (owned by `fix-ios-audio-playback`).

## Decisions

**1. A dedicated backend greeting endpoint, not a synthetic agent message.** `POST
/api/agent/greeting` mirrors `/api/loans/greeting`: deterministic, personalized by first
name, returns `assistant_text` and (accessible only) `audio_ref`. Sending a fake user
message through `/api/message` would trigger the full debt-diagnosis agent flow and is
slower and less predictable.

**2. Audio only for accessible users.** The endpoint hits `get_profile`; `audio_ref` is
synthesized only when `accessibilityMode != null`, matching the existing voz-color
autoplay contrast. Standard users get text with `audio_ref: null`.

**3. Greet once per session, only without an intent.** A `greetedForSessionRef` keyed by
`sessionId` prevents repeated POSTs/audio when the tab regains focus. Explicit intents
(quick actions) start their own first turn and are never pre-empted. A failed greeting
resets the ref so a later focus retries.

**4. Do not fight the microphone for the greeting.** The greeting fires on open, before
any mic use, so it is audible even on iOS; the separate `fix-ios-audio-playback` change
handles audibility *after* a spoken turn, so it is not duplicated here.

## Risks / Trade-offs

- **[Risk]** A system text bubble appears below the idle orb on open. → Acceptable; the
  orb/idle restructure in `add-assistant-orb-screen` can place the greeting copy instead.
- **[Risk]** Greeting could run before the persisted session hydrates. → The effect waits
  for `sessionId` (the primary bug fix) and the greeting is idempotent per session.
