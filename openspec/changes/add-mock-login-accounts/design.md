## Context

`POST /api/session` (REQ-API-01) is not deployed yet. The login screen (`app/login.tsx`) already treats login as a non-authenticating visual gate (`SPECS.md` §12) — see proposal.md for why this matters and `openspec/specs/mobile/session/spec.md` for the target behavior. The constraint driving this design is reversibility: this is throwaway code, so it needs a small, obvious blast radius and a single place to delete once the backend ships.

## Goals / Non-Goals

**Goals:**
- Let the login screen mint a usable `SessionResponse` locally, covering all four `accessibility_profile` shapes the app reacts to.
- Keep the swap confined to one seam so removing it later is a small diff, not a hunt across the codebase.
- Make the temporary nature visible in the code itself (not just in openspec), so a future contributor unfamiliar with this change notices it.

**Non-Goals:**
- Real authentication, password validation, or account management — out of scope per `SPECS.md` §12 and unchanged by this proposal.
- Changing `SessionResponse`, `session.store.ts`, or anything downstream of "a session exists" — those already treat the session as opaque.
- A remote/config-driven toggle between mock and real mode — the flip back happens by deleting code, not by a runtime flag (see Decisions).

## Decisions

- **Where the swap lives**: add a new `resolveMockSession(username, password)` in `src/features/session/mockAccounts.ts`, and branch inside `useCreateSession` (or a thin wrapper it calls) rather than touching `src/api/endpoints.ts`. `createSession()` (REQ-API-01) stays exactly as it will be when the backend is ready — nothing about the "real" path changes shape, so re-enabling it later is deleting the branch, not rewriting it.
  - Alternative considered: change `createSession()` itself to fall back to mocks. Rejected — it would put demo-only logic inside the one file the project explicitly keeps as a frozen, one-file API contract (`src/api/endpoints.ts`'s own header comment, INV-023).
- **Matching, not a picker UI**: the login screen keeps its existing username/password fields and matches them against the mock list on submit, rather than adding a new "choose a demo account" picker component. This matches the existing spec (typing anything and pressing the button is the whole flow) and avoids building throwaway UI. The four mock accounts' credentials will be shared with whoever needs to test each persona (e.g. in the mock accounts file itself, as plain visible constants — not a secret, since none of this is real auth).
- **Marking it temporary in code**: every call site of the mock path gets a `// TODO(add-mock-login-accounts): remove once POST /api/session is available` comment, matching the openspec change name so it's greppable.
- **Failure behavior**: no match simply leaves the user on the login screen (mirrors the spec's "any input succeeds" model closely enough for a demo — we don't invent an error state the real endpoint wouldn't have either, since the real flow never rejects input today).

## Risks / Trade-offs

- [Mock accounts get treated as "the login system" by future contributors] → Mitigated by the TODO comments, the spec delta's explicit removal scenario, and keeping `createSession()` untouched so the real path is one obvious grep away.
- [This change is forgotten after the backend ships] → tasks.md includes an explicit removal task; the spec's "Real endpoint restored" scenario gives `openspec validate`/review a concrete condition to point at when closing this out.
- [Mock `accessibility_profile` values drift from what the real backend will send] → Low impact: the shape is already frozen in `SessionResponse` (`src/api/types.ts`); mocks just populate it.

## Migration Plan

1. Ship the mock accounts + branch behind the TODO markers described above.
2. When the backend announces `POST /api/session` is live: delete `src/features/session/mockAccounts.ts`, remove the branch in `useCreateSession` (or wrapper), remove the TODO comments, and delete this change's directory per the project's archive workflow.
3. No data migration or rollback concerns — this never touches persisted state beyond the existing `session_id` secure-storage path, which is unaffected.
