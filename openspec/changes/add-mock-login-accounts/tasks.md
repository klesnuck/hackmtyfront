## 1. Mock accounts

- [x] 1.1 Create `src/features/session/mockAccounts.ts` with a fixed list of `{ username, password, sessionResponse }` entries covering: standard (no `accessibility_profile`), elderly, blind, and low_literacy.
- [x] 1.2 Add a `resolveMockSession(username, password): SessionResponse | null` lookup (case-insensitive username match) in the same file, generating a fresh `session_id` per call so repeated logins don't collide.

## 2. Wire into login

- [x] 2.1 In `src/features/session/useCreateSession.ts` (or a thin wrapper it calls from `app/login.tsx`), branch: if `resolveMockSession` returns a match, call `setSession` with it directly instead of calling `createSession()`; if no match, do nothing (stay on login screen).
- [x] 2.2 Add `// TODO(add-mock-login-accounts): remove once POST /api/session is available` at every call site touched in 1.1/1.2/2.1.
- [x] 2.3 Leave `src/api/endpoints.ts`'s `createSession()` untouched.

## 3. Verify

- [ ] 3.1 Manually log in with each of the 4 mock accounts and confirm: session persists (secure storage), the correct catalog activates (standard vs. accessible per REQ-ACC-01/02), and navigation reaches the dashboard.
- [ ] 3.2 Confirm an unmatched username/password leaves the user on the login screen with no crash.

## 4. Revert when the real endpoint ships

- [ ] 4.1 Confirm with the backend team that `POST /api/session` is live and matches `SessionResponse` (`src/api/types.ts`).
- [ ] 4.2 Delete `src/features/session/mockAccounts.ts` and the branch added in 2.1 (grep for `add-mock-login-accounts` to find every touch point).
- [ ] 4.3 Confirm `useCreateSession` calls `createSession()` unconditionally again.
- [ ] 4.4 Archive this change per the project's OpenSpec workflow (`openspec-archive-change`), which folds the "Real endpoint restored" scenario back into `openspec/specs/mobile/session/spec.md`.
