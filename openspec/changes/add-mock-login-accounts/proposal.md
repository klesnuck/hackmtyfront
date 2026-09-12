## Why

The backend team has not yet stood up `POST /api/session` (REQ-API-01). Without it, the login screen's "Entrar de forma segura" button has nothing to call, which blocks manual testing of every screen that sits behind the login gate (dashboard, savings, loans, transfers, assistant). We need a temporary, client-side stand-in so the rest of the app can be exercised end-to-end today, without pretending it is real authentication or letting it linger once the backend is ready.

## What Changes

- Add a small hardcoded set of mock accounts (username/password pairs) covering each `accessibility_profile` shape the app reacts to: standard (no flags), elderly, blind, and low_literacy — so both the standard and accessible catalogs (REQ-ACC-01/02) can be exercised.
- The login screen matches the typed username/password against this local mock list instead of calling `POST /api/session`; a match mints a local `SessionResponse` (a random `session_id` plus the matching `accessibility_profile`) and proceeds exactly as a real response would (same `setSession` / navigation path). No match keeps the user on the login screen (still not "authentication" — just gating which demo persona loads).
- Clearly mark this as a temporary shim in code (`TODO(add-mock-login-accounts)` comments at every call site) and in the `mobile/session` spec, with an explicit removal task once the backend exposes `POST /api/session`.
- No change to `useCreateSession`'s public shape or to `SessionResponse`/`session.store.ts` — the swap is isolated to how the login screen obtains a `SessionResponse`, so reverting later is a small, localized diff.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `mobile/session`: while `POST /api/session` is unavailable, login SHALL resolve a session by matching against a fixed local set of mock accounts instead of calling the real endpoint, and SHALL revert to the real endpoint once it is available.

## Impact

- `app/login.tsx`: account picker/fields wired to mock matching instead of blindly calling `createSession()`.
- `src/features/session/useCreateSession.ts` (or a new sibling hook): temporary branch to short-circuit the real API call.
- New file for the mock account list (e.g. `src/features/session/mockAccounts.ts`), deleted when this change is reverted.
- `src/api/endpoints.ts` / `createSession` (REQ-API-01): untouched — real call stays intact so flipping back is a one-line change once the backend confirms availability.
- `openspec/specs/mobile/session/spec.md`: delta documenting the temporary fallback and its removal condition.
