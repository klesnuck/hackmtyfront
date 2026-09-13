# CHANGELOG.md — Agent Decision & Change Log

> **Audience: AI agents.** This file is a machine-read, append-only record of every meaningful change and design decision made by AI agents working on this project.
>
> **Rules:**
> - **Append-only.** Never edit or delete a previous entry. Corrections are new entries.
> - **Newest entries go at the bottom** (chronological order).
> - One entry per meaningful change, decision, invariant change, or fix.
> - Keep entries factual and reconstruct the *why*, not just the *what*.
> - **Never record secret values.** Reference credential names only.
> - Invariant changes MUST appear here (see `INVARIANTS.md` §F).

## Entry schema

```
## [YYYY-MM-DD] <type> — <short title>
- agent: <agent/model identifier>
- requirements: <REQ-* ids touched, or "none">
- invariants: <INV-* ids affected, or "none">
- files: <paths created/changed>
- decision: <what was decided or changed>
- rationale: <why>
- impact: <consequences, dependencies, what is now unblocked/blocked>
- follow_ups: <next actions or open questions, or "none">
```

`type` ∈ `bootstrap | decision | change | fix | invariant-change | cut | risk`.

---

## [2026-09-12] bootstrap — Four-document source-of-truth established
- agent: opencode / deepseek-flash
- requirements: none
- invariants: none
- files: `AGENTS.md`, `INVARIANTS.md`, `SPECS.md`, `CHANGELOG.md`
- decision: Split project truth into four documents with strict separation of concerns: `AGENTS.md` (context, stack, operating/style/doc rules, external hackathon constraints), `INVARIANTS.md` (non-negotiable decisions; highest authority), `SPECS.md` (structured testable business requirements), `CHANGELOG.md` (this machine-readable append-only log).
- rationale: The team needs extreme modularity and fast repair/trace. Separating fixed truth from requirements from operating rules lets agents and humans locate the relevant source instantly and prevents silent architectural drift.
- impact: Authority order fixed as `INVARIANTS.md` > `SPECS.md` > `AGENTS.md`. `AGENTS.md` was rewritten from the original hackathon-rules document; hackathon constraints are preserved under §2, and architecture decisions were moved into `INVARIANTS.md`.
- follow_ups: Scaffold `/backend` per `AGENTS.md` §4 and satisfy `REQ-API-*` first.

## [2026-09-12] decision — Core product scope locked
- agent: opencode / deepseek-flash
- requirements: REQ-LM-01..09, REQ-BAG-01..08
- invariants: INV-001, INV-002, INV-005, INV-030
- files: `INVARIANTS.md`, `SPECS.md`
- decision: `La Mesa + El Revés` is the core feature; `Saving Bags` is the secondary core feature. Hard cut line: two La Mesa mutation moments, El Revés, one saving bag, one accessible persona.
- rationale: The bank judges usefulness first and rewards one extraordinary interaction over many features. The selected scope maximizes impact per engineering hour within ~24 hours across four developers.
- impact: All non-essential features are cut. Time budget is protected for the two mutation moments and the negotiation.
- follow_ups: Define the exact acceptance tests for REQ-LM-05, REQ-LM-06, REQ-LM-07.

## [2026-09-12] decision — Accessibility (Voz y Color) is automatic
- agent: opencode / deepseek-flash
- requirements: REQ-ACC-01..06
- invariants: INV-003
- files: `INVARIANTS.md`, `SPECS.md`
- decision: `Voz y Color` activates automatically from account flags (elderly, blind, other accessibility needs, low literacy). Fully duplex voice: TTS out via ElevenLabs, STT in via Gemini, with fallbacks. Audio cached by text hash.
- rationale: Automatic activation makes UI adaptability observable (judging criterion #2) and addresses a genuine financial-inclusion problem in Mexico rather than appearing as a gimmick.
- impact: Requires a second custom A2UI catalog (`voz-color`), a `voice` MCP server, an accessibility profile table, and audio caching.
- follow_ups: Coordinate catalog IDs and flags with the frontend team.

## [2026-09-12] decision — HTTP-only REST JSON transport
- agent: opencode / deepseek-flash
- requirements: REQ-API-01..08, REQ-LOOP-05
- invariants: INV-010
- files: `INVARIANTS.md`
- decision: Use plain HTTP REST JSON; each response carries the full A2UI message array. No WebSockets and no SSE. Bandwidth and streaming latency are acceptable trade-offs for a strong, simple proof of concept.
- rationale: The hackathon values a working, demonstrable loop over production-grade real-time transport. Simpler transport reduces integration risk and makes the frontend contract trivial to consume.
- impact: Progressive rendering must be emulated by the frontend applying complete message arrays; the backend never holds a streaming connection.
- follow_ups: Frontend must confirm it can apply full message arrays idempotently.

## [2026-09-12] decision — Provider abstraction with env-only failover
- agent: opencode / deepseek-flash
- requirements: REQ-NFR-01
- invariants: INV-012, INV-013
- files: `INVARIANTS.md`, `AGENTS.md`
- decision: All external capabilities sit behind narrow interfaces with configured fallback chains: LLM Gemini→DeepSeek; TTS ElevenLabs→edge-tts; STT Gemini→faster-whisper; web research Gemini grounding→deterministic price table. Selection is `.env`-only.
- rationale: Token/quota exhaustion on Gemini or ElevenLabs is probable during a 24-hour build. Env-only failover keeps development and the live demo alive without code changes.
- impact: A2UI output is validated independently of provider so the contract does not change when a provider is swapped. DeepSeek is text-only; STT and TTS fall back to local implementations.
- follow_ups: Implement `providers/registry.py` and a failover smoke test first.

## [2026-09-12] decision — Persisted generated UI with placeholder hydration and structural revalidation
- agent: opencode / deepseek-flash
- requirements: REQ-UI-01..04, REQ-BAG-08
- invariants: INV-021, INV-022
- files: `INVARIANTS.md`, `SPECS.md`
- decision: Generated UIs are persisted in SQLite per user and domain (`loans_credits` or `saving_bag`) using placeholders. The backend hydrates placeholders with fresh data immediately before delivery and runs an agent revalidation pass that may mutate structure.
- rationale: Placeholders prevent stale-data leakage; revalidation preserves the AGENTS.md requirement that the interface is a consequence of reasoning rather than a predetermined screen being refilled.
- impact: Requires a placeholder resolver, a versioned `generated_ui` table, and a revalidation hook. Data-only rehydration is explicitly insufficient.
- follow_ups: Define placeholder syntax and the revalidation trigger conditions.

## [2026-09-12] risk — Persisted UI could be mistaken for a predetermined screen
- agent: opencode / deepseek-flash
- requirements: REQ-LOOP-04, REQ-UI-03
- invariants: INV-017, INV-022
- files: `AGENTS.md`, `INVARIANTS.md`
- decision: Treat the revalidation pass as mandatory, not optional, and keep at least two structural mutation moments on stage.
- rationale: Hackathon rules forbid predetermined screens disguised as generated UI. Persistence without structural revalidation would violate the core thesis even if requirements are met.
- impact: The demo must visibly show structure (not just values) changing in response to context.
- follow_ups: Instrument the demo to highlight structural mutations.

## [2026-09-12] decision — LLM never computes financial math
- agent: opencode / deepseek-flash
- requirements: REQ-LM-03, REQ-LM-04, REQ-BAG-07
- invariants: INV-015
- files: `INVARIANTS.md`
- decision: A deterministic `engine/` module computes amortization, break detection, feasibility, and projections; the LLM only reasons about strategy and interface composition.
- rationale: Deterministic math guarantees correctness and reproducibility, makes the Kill Test meaningful, and demonstrates that MCP provides real capability rather than decorative tooling.
- impact: The engine becomes the most important unit-tested component and is insulated from provider outages.
- follow_ups: Author engine unit tests before wiring the agent to them.

## [2026-09-12] change — Local environment and secret isolation established
- agent: opencode / deepseek-flash
- requirements: none
- invariants: INV-040, INV-041, INV-012, INV-013
- files: `backend/.env`, `backend/.env.example`, `.gitignore`
- decision: Created `backend/.env` holding `GEMINI_API_KEY`, `DEEPSEEK_API_KEY`, and `ELEVENLABS_API_KEY` plus the provider-selection variables. Added `backend/.env.example` with names and placeholders only, and a root `.gitignore` that excludes `backend/.env`, `.env`, `.env.*`, and local data/artifacts.
- rationale: The build requires live provider credentials, and `INV-040` mandates they exist only in a git-ignored `.env`. Embedding provider selection in the same file keeps swaps env-only per `INV-013`.
- impact: The three keys were disclosed in a planning session and are therefore compromised per `INV-041`; they must be rotated after the event. No secret value appears in any tracked document. The backend still needs an entrypoint before the env is consumed.
- follow_ups: Implement `providers/registry.py` reading these variables; verify `.env` remains untracked once a git repository is initialized.

## [2026-09-12] decision — Storage split: local SQLite for development, Cloudflare D1 for showcase
- agent: opencode / deepseek-flash
- requirements: REQ-DATA-03, REQ-DATA-04, REQ-DATA-05, REQ-DATA-08
- invariants: INV-019, INV-020
- files: `INVARIANTS.md`, `SPECS.md`, `AGENTS.md`
- decision: Persistence is abstracted behind a repository port with two interchangeable adapters: `local_sqlite` (local SQLite file, used strictly in development) and `d1_http` (Cloudflare D1 reached via the Cloudflare REST API, used in the showcase). Selection is environment-only via `DB_BACKEND`. `CLOUDFLARE_D1_SQLITE` holds the D1 database UUID. The showcase backend is hosted locally behind a Cloudflare Tunnel. Wrangler is the migration tool for D1. On D1 unreachability or quota exhaustion the system falls back to the local seeded SQLite backend.
- rationale: D1 is managed SQLite, so the schema is portable, but the Python/FastAPI backend is not a Cloudflare Worker and can only reach D1 through the REST API. An abstraction keeps development strictly local (zero Cloudflare dependency) while the showcase runs on real D1, and a traced fallback protects the demo — "winning is mandatory".
- impact: Adds a required persistence port and adapters, D1-subset SQL constraints, new env keys, and a `wrangler.toml`. The database UUID alone is insufficient for runtime access: `CLOUDFLARE_ACCOUNT_ID` and a `D1 Read`/`D1 Write` API token are required before the showcase and will be added later. Development is not blocked.
- follow_ups: Implement the port and both adapters; create `wrangler.toml`; add `.wrangler/` to `.gitignore`.

## [2026-09-12] invariant-change — INV-020 modified; INV-019 added (Database backend abstraction)
- agent: opencode / deepseek-flash
- requirements: REQ-DATA-03, REQ-DATA-08
- invariants: INV-019 (new), INV-020 (modified), INV-022 (clarified)
- files: `INVARIANTS.md`
- decision: `INV-020` changed from "All data lives in **SQLite**. All data is mocked/seeded. No real banking integrations, no production database, no auth system." to "All data lives in **SQLite** through the repository abstraction (INV-019): a local SQLite file for development and **Cloudflare D1** for the showcase. All data is mocked/seeded. No real banking integrations, no general-purpose production database, no auth system." Added `INV-019` requiring a repository port, env-only backend selection, no Workers-binding assumption, a traced local fallback on D1 failure, and D1-subset schema/migrations/seed. Clarified `INV-022` to hydrate "from the configured database backend (INV-019)".
- rationale: The showcase requires a managed backend while development must remain fully local. Recording this as an invariant prevents silent divergence and keeps the failover guarantee non-negotiable.
- impact: Any future change to persistence must respect the port abstraction and env-only selection. Approval for this invariant change was explicitly granted by the human owner.
- follow_ups: none.

## [2026-09-12] change — Documentation and config updated for dual-backend persistence
- agent: opencode / deepseek-flash
- requirements: REQ-DATA-01, REQ-DATA-06, REQ-DATA-07, REQ-NFR-06, REQ-NFR-07
- invariants: INV-019, INV-020
- files: `SPECS.md`, `AGENTS.md`, `backend/.env`, `backend/.env.example`, `wrangler.toml`, `.gitignore`
- decision: Added `REQ-DATA-03..08` and `REQ-NFR-06/07`; updated `REQ-DATA-01`. Updated `AGENTS.md` stack, repository layout, the MCP-only rule, the documentation-fetch table (Cloudflare D1 + Wrangler), the secrets list, and the testing section (parity + fallback tests). Added `DB_BACKEND`, `CLOUDFLARE_D1_SQLITE`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, and `D1_FALLBACK_LOCAL` to the environment. Added `wrangler.toml` for D1 migrations and `.wrangler/` to `.gitignore`. Clarified that using D1 as a managed SQLite showcase host does not violate the "no production databases" hackathon constraint.
- rationale: Implementation must follow documented requirements and invariants; the environment and Wrangler config make the backend swap and D1 migrations reproducible.
- impact: `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` are intentionally left blank until before the showcase. The local development path requires no Cloudflare credentials.
- follow_ups: Populate the two Cloudflare credentials before the D1 parity run.

## [2026-09-12] risk — D1 network dependency and platform limits during the showcase
- agent: opencode / deepseek-flash
- requirements: REQ-DATA-08, REQ-NFR-07, REQ-DEMO-04
- invariants: INV-019, INV-005
- files: `INVARIANTS.md`, `SPECS.md`, `AGENTS.md`
- decision: Treat D1 as an external, fallible dependency with an approved local fallback, and constrain all SQL to the D1-compatible subset.
- rationale: Documented D1 limits are material for the demo: 100 bound parameters and 100 KB per statement, 2 MB rows, 500 MB per free database, a single-threaded database, and a 30-second query ceiling. Access is via the REST API over the Cloudflare Tunnel, so venue connectivity and latency affect every query. A full venue-internet outage would also drop the tunnel, which the local fallback cannot cover.
- impact: Writes must be batched, reads minimized, and the recorded golden-path video (`REQ-DEMO-04`) remains mandatory insurance for a total outage.
- follow_ups: Measure D1 round-trip latency during the first remote parity run and adjust batching.

## [2026-09-12] decision — Frontend scope changed from web surface to native mobile app (Expo)
- agent: claude-sonnet-5
- requirements: none (scope/stack decision; REQ-API-01..08 now consumed by a native client instead of a web client)
- invariants: none (INV-010, INV-016, INV-023 apply unchanged to the new client)
- files: `SPECS.md`, `AGENTS.md`, `MOBILE_ARCHITECTURE.md` (new)
- decision: Removed "Native mobile applications (frontend is a web surface)" from `SPECS.md` §12 out-of-scope list. The frontend is now a native mobile app built with **Expo (React Native) + TypeScript**, not a web app. Chose Expo over Tauri v2 mobile despite Tauri allowing near-1:1 reuse of a React-DOM A2UI catalog, because the team's development machines are Windows and Tauri iOS builds require local Xcode/macOS with no cloud path, while Expo's EAS Build compiles iOS binaries in the cloud without a local Mac. The user holds an Apple Developer account, which removes EAS/TestFlight's remaining friction (signing, internal distribution) entirely. Full rationale and architecture in `MOBILE_ARCHITECTURE.md`.
- rationale: Explicit human approval was given in-session to override the previously documented "web surface" scope decision. Shareability and demo-readiness on a 24h/4-developer hackathon timeline, on Windows dev machines, outweighs the code-reuse savings Tauri would have offered.
- impact: `AGENTS.md` §3 (frontend stack) and §4 (repository layout, adds `/mobile`) updated accordingly. The custom A2UI catalog (`INV-016`) must now be built with React Native primitives instead of DOM/CSS — this is new engineering work, not a port. The earlier root-level Vite/React web scaffold in this repository predates this decision and was an explicit throwaway test (not a `SPECS.md`-driven build); it should be relocated or removed before `/mobile` and `/backend` are scaffolded at repo root.
- follow_ups: Scaffold `/backend` and `/mobile` per `AGENTS.md` §4; relocate or delete the pre-existing root-level Vite prototype; confirm Apple Developer team enrollment (Individual vs Organization) before the first EAS/TestFlight submission.

## [2026-09-12] fix — Corrected repository scope: this repo is frontend/mobile-only, backend is a separate repository
- agent: claude-sonnet-5
- requirements: none
- invariants: none
- files: `AGENTS.md`, `MOBILE_ARCHITECTURE.md`
- decision: The previous entry's follow-up ("scaffold `/backend` and `/mobile` per `AGENTS.md` §4") was wrong for this repository. The user clarified this repo (`hackmtyfront`) owns the frontend/mobile app only; the backend (Python/FastAPI/MCP system described in `AGENTS.md` §3-§4) lives in a separate repository and is reached solely through the frozen REST contract (`SPECS.md` §8). `AGENTS.md` §3 and §4 were corrected to label the backend section as external/reference-only and to show this repo's actual layout: the Expo app lives at repo root, not nested under a `/mobile` folder. `MOBILE_ARCHITECTURE.md` §0, §2, §9, and §11 were corrected to match (no `/backend` scaffolding here, root-level Expo layout, cross-repo coordination note for the API base URL and the `a2ui[]` schema).
- rationale: Keeping `AGENTS.md` accurate about what this repository does and does not own prevents an agent from scaffolding a backend that doesn't belong here or misreading `/backend` as a local path.
- impact: The correct next step in this repository is to scaffold the Expo app directly at repo root after relocating the throwaway Vite prototype (`MOBILE_ARCHITECTURE.md` §0) — not to create `/backend` here.
- follow_ups: Confirm with the backend team/repo the `a2ui[]` schema and `SPECS.md` §8 endpoint shapes before both sides build against assumptions (`MOBILE_ARCHITECTURE.md` §11).

## [2026-09-12] bootstrap — Expo SDK 57 app scaffolded: A2UI engine, standard + accessible catalogs, login/dashboard/assistant screens
- agent: claude-sonnet-5
- requirements: REQ-MENV-01..13, REQ-MA2UI-01..09, REQ-MCAT-01..16, REQ-MACC-01..03, REQ-MSCR-01..04, REQ-MVOICE-01..03, REQ-MMOTION-01..04, REQ-MNET-01..04, REQ-MNFR-01..03 (all in `MOBILE_SPECS.md`, new)
- invariants: none violated; INV-010, INV-016, INV-017, INV-023 all directly exercised by this build
- files: `MOBILE_SPECS.md` (new), `app.config.ts`, `eas.json`, `.env.example`, `.npmrc`, `eslint.config.js`, `app/*` (root layout, index, login, dashboard, assistant), `src/a2ui/*` (engine), `src/catalog/standard/*` + `src/catalog/voz-color/*` (18 components each), `src/catalog/shared/AnimatedPressable.tsx`, `src/theme/{tokens,motion}.ts`, `src/api/*`, `src/state/*`, `src/features/{session,voice}/*`; removed the earlier throwaway Vite web prototype
- decision: Scaffolded the actual Expo app at repo root (not `npx create-expo-app@latest`'s default, which resolves whatever SDK is newest on npm — SDK 57 at the time of this build — pinned explicitly per the user's report that Expo Go had just moved from SDK 54 to SDK 57; verified via `npm view expo versions`, not assumed). Built the A2UI engine against the REAL v0.9.1 protocol fetched from a2ui.org (envelope messages `createSurface`/`updateComponents`/`updateDataModel`/`deleteSurface`, JSON-Pointer data binding, flat id-addressed component graph) rather than the simplified model `MOBILE_ARCHITECTURE.md` originally sketched — that document's §4 rule 3 has been corrected accordingly. Implemented all 18 A2UI "basic" catalog component types in both `standard` and `voz-color` catalogs, enforced to stay in parity by a closed TypeScript union (`CatalogRegistry` over `BasicNodeType`) rather than a runtime check. Dropped NativeWind and Moti after finding real, current stability/compatibility concerns for each against this SDK/Reanimated version (details and sources in the agent's research; summarized in `MOBILE_SPECS.md` REQ-MENV-05/06) — styling is plain `StyleSheet` + tokens, animation is `react-native-reanimated` v4 directly. Ported the team's earlier Figma-derived Banorte login design (from this repo's original Figma-to-code test) into the real login screen, wired to `POST /api/session` (a mocked session bootstrap, not authentication — `SPECS.md` §12 excludes auth entirely).
- rationale: The user asked for the system's specs plus a scaffold "ready to jump straight to execution" — folder structure, package.json with carefully version-matched libraries, the A2UI engine, standard catalog, and the login/dashboard/assistant screens, with a deliberate animation strategy. Guessing library versions was explicitly called out as a risk to avoid, so every dependency was resolved via `npx expo install`/`--fix` (which reads the actual SDK compatibility table) rather than typed from memory; the two libraries that were hand-evaluated (NativeWind, Moti) were researched first and rejected for concrete, sourced reasons rather than guessed.
- impact: `npm run typecheck`, `npm run lint`, and `npm run doctor` all pass clean; `npx expo export --platform ios` bundles the full app (1765 modules) with zero errors, confirming Metro/Hermes can actually resolve and compile everything, not just `tsc`. A bonus web target (`react-dom`, `react-native-web`, `@expo/metro-runtime`) was added and used for a headless-Chrome visual smoke test of all three screens — layout, brand colors, and animations render as designed; a narrow-viewport (~430px) content-clipping artifact appeared in headless Chrome specifically and is flagged in `MOBILE_SPECS.md` REQ-MNFR-03 as unverified on a real device. The app has NOT been run on a physical device, Expo Go, or a simulator — none were available in this session. Several pieces are explicitly not built yet and tracked as open `MOBILE_SPECS.md` items: the Kill Test viewer, product-specific catalog components (BreakAlert, NegotiationRound, Tradeoff, etc. — deliberately not guessed without backend agreement on their shape), full accessible variants for TextField/CheckBox/ChoicePicker/Slider/DateTimeInput, and any automated tests.
- follow_ups: Run on a real device via Expo Go before trusting anything beyond the web preview (`MOBILE_SPECS.md` REQ-MNFR-05). Agree the `a2ui[]` vocabulary and product-specific node shapes with the backend team (REQ-MA2UI-10) before building La Mesa/El Revés/Saving Bags catalog components. Replace the placeholder bundle identifiers in `app.config.ts` before the first production EAS Build (REQ-MENV-11/12).

## [2026-09-12] decision — Mobile requirements move to OpenSpec; MOBILE_SPECS.md retired; six screens reviewed against Figma and proposed as changes
- agent: claude-sonnet-5
- requirements: none directly (process change); informs future REQ-* work via `openspec/`
- invariants: none
- files: `AGENTS.md` (new §2a), `MOBILE_SPECS.md` (deleted), `openspec/specs/mobile/{a2ui-engine,catalog-standard,catalog-accessible,session,voice}/spec.md` (new, baseline), `openspec/changes/archive/2026-09-12-document-mobile-foundation/` (new), `openspec/changes/{add-navigation-and-dashboard,add-assistant-orb-screen,add-loans-management,add-savings-management,add-error-screen,add-transfers}/` (new, proposed)
- decision: The user corrected this session's earlier approach — `MOBILE_SPECS.md` at repo root was the wrong place for mobile requirements; `openspec` (the CLI, already initialized in this repo at `openspec/config.yaml`, schema `spec-driven`) is the intended tool. `AGENTS.md` §2a now documents the propose → apply → archive workflow as a standing rule for mobile frontend work. The five already-implemented capabilities (A2UI engine, standard catalog, accessible catalog, session/login, voice) were written as delta specs, validated, and archived into `openspec/specs/mobile/` as the new baseline (19 requirements total) — `openspec archive`'s own folder-move step hit a persistent Windows `EPERM` renaming the change directory (see `follow_ups`); the change was moved into `openspec/changes/archive/` via copy+delete instead, and the main specs (which the failed command had rolled back along with the move) were reconstructed by hand from the already-authored delta specs and re-validated. Separately, the user supplied Figma links for Dashboard (`37:42`), AI Assistant (`37:123`), Préstamos Activos (`37:160`), Mis Ahorros (`37:266`), and a general Error screen (`37:351`), asking that the already-built dashboard and assistant screens be checked against them. Neither matches: the dashboard is missing a persistent 4-tab bottom nav (Inicio/Préstamos/Apartados/Soporte IA, present on every reviewed screen), an AI banner card, an account balance card, and a 3-icon quick-actions row; the assistant screen has no idle/greeting state at all — Figma's version is a floating animated orb plus "Escribir"/"Hablar" entry buttons, not the always-visible chat UI that was built (which remains correct as the *active-conversation* state, just not the landing state). Six change proposals were written (planning artifacts only, per the `openspec-propose` skill's explicit no-code-during-propose rule): `add-navigation-and-dashboard`, `add-assistant-orb-screen`, `add-loans-management`, `add-savings-management`, `add-error-screen`, `add-transfers` — the last three (loans/savings manual creation, transfers) have no Figma reference and were specified from the product description ("interactuar con la aplicación como cualquier app de banco... reflejadas en datos actualizados").
- rationale: Honor the user's explicit process correction (spec-driven development via OpenSpec, not ad hoc root markdown) and use the newly supplied Figma references as ground truth for what still needs to change, rather than silently declaring the earlier build "done."
- impact: `openspec/specs/` is now the authoritative, CLI-validated source for mobile requirements (`openspec list --specs` / `openspec validate --specs` both pass). No app code changed in this pass — `add-navigation-and-dashboard` and `add-assistant-orb-screen` in particular describe real, not-yet-built restructuring (tab navigation, an idle orb screen) that the current `app/dashboard.tsx`/`app/assistant.tsx` do not have. `add-loans-management`, `add-savings-management`, and `add-transfers` each flag a real gap in `SPECS.md` §8's frozen backend contract (no loans, savings-vehicle, or transfer resources exist there yet) that needs backend-team agreement before their `tasks.md` can be started, per each change's own design.md.
- follow_ups: Report the OpenSpec `EPERM` file-lock issue if it recurs — likely an environment-specific (OneDrive-synced "Documents" folder) interaction with Node's `fs.rename`, worth a `openspec doctor`/upstream issue if it blocks a future archive. Get backend-team sign-off on the loans/savings/transfers data shapes before applying those three changes. Sequence `add-navigation-and-dashboard` before `add-transfers` (the latter's design depends on the former's balance card existing). Run `/opsx:apply` (or the `openspec-apply-change` skill) on each proposal when ready to implement.

## [2026-09-12] change — Wired Inicio, Préstamos, and login to the real backend; live "Abonar" payment action replaces the inert "Pagar ahora"
- agent: claude-sonnet-5
- requirements: none formally tracked here yet (this repo's REQ-* ids live in `openspec/specs/mobile/` and none of those specs cover finance data screens); addresses the backend repo's new, not-yet-numbered finance endpoints (see `amitie/CHANGELOG.md` same-day entry and `amitie/SPECS.md` §9 contract note)
- invariants: INV-023 respected (backend owns data/logic; this repo only renders and calls the frozen+extension contract)
- files: `src/api/types.ts`, `src/api/endpoints.ts`, `src/state/session.store.ts`, `src/features/session/{mockAccounts,useCreateSession}.ts`, `app/login.tsx`, `app/(tabs)/inicio.tsx`, `app/(tabs)/prestamos.tsx`, `src/features/dashboard/format.ts` (new, replaces deleted `mockAccount.ts`), `src/features/loans/loans.ts` (new, replaces deleted `mockLoans.ts`), `src/features/loans/LoanCard.tsx`, `src/features/loans/AbonoModal.tsx` (new)
- decision: The user asked to stop showing hardcoded cards and wire real, persisted backend data wherever the backend already supports it, and specifically to give the loans panel's dead "Pagar ahora" text a real action, renamed "Abonar". Backend coordination (same session) added `GET /api/profile|accounts|liabilities` and `POST /api/liabilities/{id}/payment`. On the frontend: (1) `SessionResponse` was corrected to match the backend's actual `{session_id, user_id}` shape (it previously carried an invented `accessibility_profile` field the backend never returned); (2) login now calls the real `POST /api/session` for one of two seeded personas (`u_ana`/`u_don`, mapped from the existing demo/elderly/blind/lowliteracy picker) and reads the account's real accessibility mode via `GET /api/profile` instead of guessing it from the username — `useSessionStore` persists `userId` and `accessibilityMode` (SecureStore) alongside `sessionId`; (3) Inicio's balance card now queries `GET /api/accounts` + `GET /api/profile` for the real display name, institution, kind, and balance (no CLABE — the backend schema has none, so that row now copies the real account id instead of a fabricated CLABE); (4) Préstamos now queries `GET /api/liabilities`, mapped to the existing `Loan` shape (paid-off liabilities drop off the list, since the backend has no synthetic "overdue" signal, every active liability reads as on-track rather than fabricating lateness); (5) `LoanCard`'s "Pagar ahora" `Text` became a `Pressable` "Abonar" wired to a new `AbonoModal`, which posts to `/api/liabilities/{id}/payment` and invalidates both the `loans` and `accounts` query caches on success so the balance card reflects the real debit immediately. The manual "Solicitar préstamo" application flow was left as a UI-only simulation — the backend has no loan-origination endpoint.
- rationale: Matches the user's explicit request and keeps the "frozen contract, backend owns logic" boundary (INV-023) intact — no math or persistence was added client-side; every number now shown comes from a backend response.
- impact: `npm run typecheck` and `eslint` pass clean on every changed file. `src/features/dashboard/mockAccount.ts` and `src/features/loans/mockLoans.ts` were deleted (fully superseded, no remaining imports). Apartados (savings) and the Transferir flow are still mocked — the backend already exposes `GET/POST /api/saving-bags*` for the former, but that screen wasn't touched this pass; Transferir has no backend counterpart at all (no accounts-transfer endpoint exists).
- follow_ups: Wire Apartados to the existing saving-bags endpoints next (lowest-effort remaining gap — the contract is already there). Decide with the backend team whether to formalize `GET /api/profile|accounts|liabilities` + the payment endpoint as numbered specs (mobile `openspec` specs here, `SPECS.md` §8/§9 there). No local device/simulator/Expo Go run was performed in this session (no Node/Expo environment available here beyond `tsc`/`eslint`) — verify the Abonar flow and balance refresh against a running backend on a real device before demo.

## [2026-09-13] fix — Loans consult: visible errors, 5s budget, and the missing terminal components
- agent: opencode / deepseek-flash
- requirements: `openspec/changes/harden-loans-consult-sync` (proposed); backend REQ-LM-12/REQ-LM-13
- invariants: INV-010 preserved (HTTP only — websockets explicitly rejected as the fix)
- files: `app/(tabs)/asistente.tsx`, `src/features/loans/useLoanConsult.ts`, `src/api/endpoints.ts`, `src/api/types.ts`, `src/a2ui/registry.ts`, `src/catalog/standard/{ScenarioComparison,PlanTable,ForecastChart,LineChart,BreakAlert,charting}.tsx` (new), `src/catalog/standard/{index,LoanOffer}.tsx`, `src/catalog/voz-color/index.ts`, `openspec/changes/harden-loans-consult-sync/`
- decision: The user reported that a real device session "did nothing" after the mic/text turn while the backend reached DeepSeek. Backend traces showed the consult made two LLM attempts and then failed its own A2UI JSON-schema validation (bare `action` strings and `{{...}}` placeholders on numeric `LoanOffer` props), returning `200 {status:"error", error_code:"agent_error"}` — and the client silently ignored it. Fixed the client half: (1) `submitText` now renders `status:'error'` as a Spanish bubble (mapped via `loanErrorMessage`) and the hook's `errorMessage` is surfaced; (2) `useLoanConsult` keeps `sessionId`/`loanRequestId` in refs set synchronously by `greet`/`send`, removing the greet→send same-tick race; (3) `loansGreeting`/`loansConsult` gained an 8s `AbortController` timeout with a handled message; (4) implemented `ScenarioComparison`, `PlanTable`, `ForecastChart`, `LineChart`, and `BreakAlert` (closed `BasicNodeType` union → compile-enforced parity in both catalogs; charts use the already-declared `react-native-svg`), since the backend prompt mandates them; (5) `getAudioAssetUrl` accepts a bare `audio_id` or the absolute `audio_ref` and never double-prepends `/api/audio/`; `LoanOffer`'s accept affordance is hidden when `amount <= 0`. The user explicitly chose to implement the components rather than restrict the backend, and accepted a deterministic fallback terminal as the backend safety net.
- rationale: The failure was a two-repo contract synchronization bug plus silent client error handling — not a transport problem. `INV-010` forbids sockets, and websockets would not have made `action` an object, made `{{...}}` valid on a numeric prop, or made the client render errors. Implementing the missing components closes the catalog drift that would have left the terminal mostly blank even after validation was fixed.
- impact: `openspec/changes/harden-loans-consult-sync/` proposes the requirements (proposal + design + tasks + deltas for `mobile/loans-assistant`, `catalog-standard`, `catalog-accessible`, `a2ui-engine`). No invariant changed and no new dependency added. Not run locally: this environment has `node_modules` but no `node`/`npm` binary, so `npm run typecheck`/`npm run lint` could not be executed here — they must be run by the user (tasks.md 4.1/4.2). Backend suite is green at 199 tests.
- follow_ups: Run `npm run typecheck` and `npm run lint`; then the manual checks in `tasks.md` §4 (offer with `roberto`/`sofia`, not-eligible with `demo`/`u_ana`, forced timeout/stopped backend, accessible auto-play). Archive `add-loans-consult-flow` before/with this change so the `mobile/loans-assistant` deltas fold cleanly. `openspec` CLI is not installed in this environment, so `openspec validate harden-loans-consult-sync` must be run by the user.

## [2026-09-13] fix — iOS TTS audio never played (cache extension + audio session)
- agent: opencode / deepseek-flash
- requirements: `openspec/changes/fix-ios-audio-playback` (proposed)
- invariants: INV-010 untouched (playback of already-fetched audio; no transport change)
- files: `src/features/voice/audioCache.ts`, `app/_layout.tsx`, `src/features/voice/useSpeechToText.ts`, `src/catalog/standard/AudioPlayer.tsx`, `src/api/endpoints.ts`, `openspec/changes/fix-ios-audio-playback/`
- decision: Backend served audio correctly (`GET /api/audio/aud_…` 200, `audio/mpeg`), but iOS played nothing. Two client causes: (1) `audioCache.ts` saved the MP3 bytes as `…m4a`, and iOS `AVPlayer` picks its demuxer from the extension, so the file failed to load; (2) no `setAudioModeAsync({ playsInSilentMode: true })` was ever called, so the silent switch (and the record category left by speech recognition) muted playback. Fixed by caching as `.mp3`, configuring a media playback session at app startup and re-asserting it after on-device speech recognition ends (plus defensively before each play), and surfacing download/load/play failures via a dev `console.warn` instead of `void`-discarding them. Also added `resolveApiUrl`/`getApiBaseUrl` and used them in the catalog `AudioPlayer` so a relative `/api/audio/...` node URL is resolved against the origin. The user chose the minimal fix; the provider-based `useAudioPlayer(...).replace(url).play()` refactor is documented as the fallback in the change's `design.md`, not implemented.
- rationale: The extension mismatch is a hard decode failure on iOS and the missing audio session is a silent-mute failure; both are required for audible TTS. Keeping the change minimal avoided replacing the download layer before confirming the root cause.
- impact: `openspec/changes/fix-ios-audio-playback/` modified `mobile/voice` (cache format) and added two requirements (playback audio session; observable failures). Not run locally: this environment has no `node` binary, so `npm run typecheck`/`npm run lint` and the iOS checks in `tasks.md` §5 must be run by the user.
- follow_ups: Run `npm run typecheck`/`lint` and iOS verification (silent switch on/off, after a mic turn, accessible auto-play). If audio still fails, apply the documented provider refactor. `openspec validate fix-ios-audio-playback` must be run by the user (CLI not installed here).

## [2026-09-13] feature — Asistente greets on open (backend `/api/agent/greeting`)
- agent: opencode / deepseek-flash
- requirements: `openspec/changes/add-assistant-initial-greeting` (proposed); backend REQ-API-12
- invariants: none changed (HTTP-only preserved)
- files: `src/api/types.ts`, `src/api/endpoints.ts`, `app/(tabs)/asistente.tsx`, `src/features/voice/audioCache.ts`, `openspec/changes/add-assistant-initial-greeting/`
- decision: The tab never started a turn on open — the only initial-turn logic required an `intent` route param, and both the bottom-nav tab and the Inicio banner open it with none, so no `POST` was made and the assistant never spoke first. When the first turn did happen (via the mic), the active speech-recognition audio session blocked the reply's TTS. Added `agentGreeting(sessionId)` calling the new backend `POST /api/agent/greeting`, and a focus effect that greets once per `sessionId` when there is no intent and no conversation, rendering `assistant_text` and auto-playing `audio_ref` for `voz-color`. Also fixed the one-shot `hasSentInitialIntent` guard, which was consumed before `sessionId` was available and could permanently swallow the initial turn. `audioCache.playAudioAsset` now retries the `.playback` session switch once, for the recognized-then-reply timing.
- rationale: A deterministic backend greeting (mirrors `/api/loans/greeting`) is faster and more reliable than pushing a synthetic user message through the agent, and the greeting fires before any mic use so it is audible.
- impact: New OpenSpec change `add-assistant-initial-greeting` (adds the greeting requirement to `mobile/assistant`); playback-audibility remains owned by `fix-ios-audio-playback` to avoid duplicating the `mobile/voice` delta. Backend suite 202 tests passing. Not run locally: no `node` binary, so `npm run typecheck`/`lint` and the iOS checks in `tasks.md` §3 are the user's.
- follow_ups: Run typecheck/lint and the manual checks; apply/archive alongside the pending `add-assistant-orb-screen` (which owns the idle-screen layout the greeting now appears in).

## [2026-09-13] fix — Asistente greeting falls back when /api/agent/greeting is unavailable
- agent: opencode / deepseek-flash
- requirements: `openspec/changes/add-assistant-initial-greeting` (updated)
- invariants: none changed
- files: `app/(tabs)/asistente.tsx`, `API_KNOWLEDGE.md`, `openspec/changes/add-assistant-initial-greeting/`
- decision: A real-environment run showed `POST /api/agent/greeting → 404` while the backend source registers the route, i.e. the serving process predated the new router (or was a different build). The user chose to keep the new endpoint. Kept the endpoint as the normal path, fixed nothing in the route, and made the client resilient: if the greeting request fails with `404` (route missing) or status `0` (unreachable), the tab now starts the conversation through the existing `POST /api/message` (`text: 'Hola'`) instead of dead-ending; other failures leave the greeting retryable on the next focus. Also synced the frontend `API_KNOWLEDGE.md` copy, which was missing `/api/agent/greeting`.
- rationale: `keep the new endpoint` means the 404 is a deployment problem, not a contract change — so the code fix is a graceful degradation plus documentation, not a path swap. This removes the dead-tab failure mode regardless of backend version.
- impact: No backend change (route already registered; verified in `openapi()` and by `tests/test_agent_greeting.py`). Operational step remains: restart/redeploy the backend so the route is served. Not run locally (no `node`): `npm run typecheck`/`lint` and the iOS checks.
- follow_ups: Restart/redeploy the backend and confirm `POST /api/agent/greeting` returns 200; run typecheck/lint; optionally route the Inicio "Asistente de Préstamos" banner to the loans flow (`intent: 'prestamo-nuevo'`) if it should use `/api/loans/greeting` instead of the generic greeting.

## [2026-09-13] change — assistant idle copy names the persona "Luna" (feminine)
- agent: opencode / deepseek-flash
- requirements: none (branding/persona)
- invariants: none
- files: `app/(tabs)/asistente.tsx`
- decision: The hardcoded idle subtitle now reads "Hola Daniela, soy Luna, tu asesora de crédito…", matching the backend persona (feminine) that now introduces itself as Luna. No other frontend copy or app metadata changed.
- rationale: Keep the on-screen assistant voice consistent with the backend's new persona without touching the app name or non-AI UI.
- impact: Copy-only; `npm run typecheck`/`lint` still to be run by the user (no `node` here).
- follow_ups: None.

## [2026-09-13] fix — Asistente serializes turns (no overlapping message/voice/action requests)
- agent: opencode / deepseek-flash
- requirements: `openspec/changes/serialize-assistant-turns` (proposed)
- invariants: INV-010 untouched (serializes existing HTTP calls; no transport change)
- files: `src/state/ui.store.ts`, `app/(tabs)/asistente.tsx`, `src/a2ui/actionBus.ts`, `src/features/voice/useSpeechToText.ts`, `src/features/loans/useLoanConsult.ts`, `openspec/changes/serialize-assistant-turns/`
- decision: The Soporte IA screen allowed the user to start a turn while a previous one was pending, so the backend got overlapping requests for one conversation and interleaved its replies. The guard was a React state boolean (`isSending`) read from a stale render closure, the mic was never disabled during a send, and the send button stayed enabled while the mic was recording (only the `TextInput` was non-editable); the A2UI `sendAction` path and the loan confirmation had no shared guard. Added a synchronous mutex to `useUiStore` (`turnInFlight`/`beginTurn`/`endTurn`; zustand `get`/`set` are synchronous, unlike state) and routed every server-bound turn through it: `/api/message`, `/api/loans/greeting`, `/api/loans/consult`, `/api/agent/greeting`, `/api/action`, and `POST /api/loans`, plus the initial-intent and focus-greeting effects. The mic is disabled while a turn is in flight; send/input are disabled for the full recording lifecycle. The lock releases as soon as the response arrives (not after TTS playback) and in every `finally`, so errors/timeouts never stick. Added defensive `start`/`stop` and `greet`/`send` re-entrancy refs in the leaf hooks. Client-routed `request_loan` stays lock-free (local modal). Per user decision: all turns share the lock; release on response.
- rationale: A client coordination bug, not a backend one, and the only reliable guard is a synchronous lock shared across the screen and the action bus. Rejected alternatives: keeping `isSending` + a local ref (doesn't cover `actionBus`), `AbortController`-only (still sends the second request), backend dedup (out of scope). Trade-off: a surface action pressed while busy is ignored, not queued; the surface stays visible and can be pressed again after the response.
- impact: New OpenSpec change `serialize-assistant-turns` (ADDED `mobile/assistant` turn-serialization requirements; MODIFIED `mobile/a2ui-engine` to gate actions). `mobile/assistant` is still pending from `add-assistant-orb-screen`/`add-assistant-initial-greeting`, so archive together. `npm run typecheck` clean. `npm run lint` could not run in this environment due to a pre-existing `unrs-resolver` native-binding failure (`Cannot find native binding`, npm optional-deps bug), not caused by this change.
- follow_ups: Run `npm run lint` after repairing the eslint resolver; run `npx @fission-ai/openspec validate`; manual double-fire checks (double-tap send, mic-during-send, send-during-record, action-during-send) against the backend.

## [2026-09-13] fix — loan comparison cards label and mark payment terms
- agent: opencode / deepseek-flash
- requirements: `openspec/changes/show-loan-term-cards` (proposed); backend `term_options`
- invariants: none (same component/props; no transport change)
- files: `src/catalog/standard/ScenarioComparison.tsx`, `openspec/changes/show-loan-term-cards/`
- decision: After a loan offer the comparison cards rendered the backend's debt-payoff scenarios; for a debt-free user every card read "Plazo 1 meses / Interés total $0". The frontend was faithful (it reads `payoffMonths`/`totalInterest` and passes arrays through), so the fix is the backend serving engine-backed **plazo** options (see the backend CHANGELOG). On the client, `ScenarioComparison` now hides the generic "Plazo" row when a card's label is already a term (`/^\d+ meses$/i`) and adds a "Recomendado" tag on the highlighted term card; debt-scenario labels ("Pago mínimo", "Abono extra $X/mes") keep the "Plazo" row unchanged. No client-side recomputation.
- rationale: The term is the card title for plazo cards, so repeating it in a "Plazo" row is noise; making the recommended term explicit turns the highlight into a clear choice. Keeping the same component and props avoids a catalog/wire change.
- impact: New OpenSpec change `show-loan-term-cards` (ADDED `mobile/loans-assistant` "terminal offer compares loan payment terms"; ADDED `mobile/catalog-standard` term-card labeling). `npm run typecheck` clean; `npx @fission-ai/openspec validate --all` 19/19. `npm run lint` still blocked by the pre-existing `unrs-resolver` native-binding failure. Depends on the backend change (separate repo); renders the old cards until it lands.
- follow_ups: Run `npm run lint` after repairing the eslint resolver; manual check with `u_don` (plazo cards with real values) and a debt persona (La Mesa debt scenarios unchanged).

## [2026-09-13] fix — show the personalized recommended plazo and its reason
- agent: opencode / deepseek-flash
- requirements: `openspec/changes/show-loan-term-cards` (proposed); backend `recommend_term`
- invariants: none (same component/props; no transport change)
- files: `src/catalog/standard/ScenarioComparison.tsx`, `openspec/changes/show-loan-term-cards/`
- decision: The highlighted card now reflects the backend's per-applicant recommendation (profile, payment likelihood/behavior, requested amount) instead of a fixed 24, and shows the recommended card's optional `note` (the reason). The offer's own term matches the recommendation on the backend. On the client, `ScenarioComparison` reads the optional `note` from a scenario and renders it as a small caption; the term-label/recommended-tag behavior from the earlier change is unchanged.
- rationale: The user requires the recommended plazo to vary and to be explained; the note makes the choice legible. `scenarios` is an `any` prop, so no catalog/registry change was needed.
- impact: `openspec/changes/show-loan-term-cards` updated (personalized recommendation + optional note). `npm run typecheck` clean; `npx @fission-ai/openspec validate --all` green (19/19). `npm run lint` still blocked by the pre-existing `unrs-resolver` native-binding failure. Depends on the backend change (separate repo).
- follow_ups: Run `npm run lint` after repairing the eslint resolver; manual check that the reason caption renders on the recommended card.

## [2026-09-13] fix — iOS reply volume after the mic, and a "Tu plazo" term tag
- agent: opencode / deepseek-flash
- requirements: `openspec/changes/fix-ios-audio-playback` and `show-loan-term-cards` (updated)
- invariants: INV-010 untouched (playback only; no transport change)
- files: `src/features/voice/useSpeechToText.ts`, `src/features/voice/audioCache.ts`, `app/_layout.tsx`, `src/catalog/standard/ScenarioComparison.tsx`, `openspec/changes/{fix-ios-audio-playback,show-loan-term-cards}/`
- decision: (1) On iOS the first greeting was loud but every reply after using the mic was quiet: `expo-speech-recognition` leaves `AVAudioSession` in its `playAndRecord`/`measurement` state, so later playback routed through the quiet receiver/voice-processed path. `useSpeechToText` now deactivates the recognizer's session and restores the playback category on end (`setAudioSessionActiveIOS(false)` + `setCategoryIOS({category:'playback',categoryOptions:[],mode:'default'})`) and passes `iosCategory` `{playAndRecord, defaultToSpeaker, default}` on start; `audioCache`/`_layout` set the full playback mode (`shouldRouteThroughEarpiece:false`, `interruptionMode:'doNotMix'`), create players with `keepAudioSessionActive:true`, set `volume=1`, and release them on finish. (2) `ScenarioComparison` now shows "Tu plazo" (instead of "Recomendado") on a card flagged `requested`, which the backend sets for the term the user asked for.
- rationale: The recognizer's session state, not the audio file, caused the volume drop; explicitly releasing it and forcing speaker playback restores consistent loudness. The term tag distinguishes the engine's pick from the user's own choice.
- impact: No client-side math; the backend now bands plazos by amount and confirms a user-stated term before offering it. `npm run typecheck` clean; `npx @fission-ai/openspec validate --all` green. `npm run lint` still blocked by the pre-existing `unrs-resolver` native-binding failure. Depends on the backend change (separate repo).
- follow_ups: Verify on an iOS device: greeting and post-mic replies at equal volume (silent switch on/off); confirming a stated term builds the loan at that term.

## [2026-09-13] change — loans intake flow + 12s client budget
- agent: opencode / deepseek-flash
- requirements: `openspec/changes/loans-intake-flow` (proposed); backend intake/deadline changes
- invariants: INV-010 untouched (HTTP only; no transport change)
- files: `src/api/endpoints.ts`, `openspec/changes/loans-intake-flow/`
- decision: Raised the loans client timeout from 8 s to 12 s so the backend's new 6.5 s LLM budget (3.5 s for the intake turn) plus local TTS always lands before the app aborts. Added the frontend OpenSpec change `loans-intake-flow` (`mobile/loans-assistant`): the assistant asks for the amount and purpose before offering, keeps the amount across turns, honors an explicit maximum, and only then renders the terminal offer — an intake turn renders as an assistant message with no surface. No UI code changes: the existing `{response_text, terminal_response: null}` handling covers it.
- rationale: The backend now keeps the conversation in an intake loop instead of jumping to the maximum when it does not understand; the client budget must accommodate the longer LLM deadline and the deterministic fallback.
- impact: `npm run typecheck` clean; `npx @fission-ai/openspec validate --all` green. `npm run lint` still blocked by the pre-existing `unrs-resolver` native-binding failure.
- follow_ups: Manual check on device: "quiero un crédito" asks for the amount; the amount persists; "dame el máximo" offers the maximum.

## [2026-09-13] fix — native orb crash: keep CanvasKit out of the RN bundle
- agent: opencode / deepseek-flash
- requirements: `openspec/changes/fix-orb-native-canvaskit-bundle` (proposed)
- invariants: none (bundling fix; no transport/wire change)
- files: `src/features/assistant-orb/{skiaWeb.ts,skiaWeb.web.ts,skiaWeb.native.ts,AnimatedOrb.tsx}`, `openspec/changes/fix-orb-native-canvaskit-bundle/`
- decision: Incorporating the Skia particle orb crashed the iOS/Android bundle with `Unable to resolve module fs from .../canvaskit-wasm/bin/full/canvaskit.js`. `AnimatedOrb.tsx` statically imported `LoadSkiaWeb` from `@shopify/react-native-skia/lib/module/web`; that module imports `canvaskit-wasm/bin/full/canvaskit`, whose Emscripten glue has a literal Node-only `if(qa){var fs=require("fs");require("path");...}` Metro cannot statically eliminate. Native never uses CanvasKit (it uses Skia's native backend), so the web-only WASM glue must not be in the native graph. Fixed by platform-splitting the bootstrap (the existing `useOrbAmplitude.native.ts`/`.web.ts` pattern): `skiaWeb.web.ts` re-exports Skia's `LoadSkiaWeb`, `skiaWeb.native.ts` is a no-op that imports nothing web, and `skiaWeb.ts` is a declaration-only type shim. `AnimatedOrb.tsx` now imports `loadSkiaWeb` from `./skiaWeb`; the `Platform.OS === 'web'` guard and the deferred `require('./OrbCanvas')` are unchanged.
- rationale: The crash was CanvasKit-related but a bundling problem, not a runtime one — the orb's renderer is fully native-supported. A platform file is the project's established, local fix; a Metro `resolver`/`fs` alias or a dynamic `import()` would be global or still bundled on native, respectively. No change to props, `OrbCanvas`, `useOrbAmplitude*`, `micVolumeSignal`, or the backend.
- impact: New OpenSpec change `fix-orb-native-canvaskit-bundle` (ADDED `mobile/assistant-orb` "Orb boots on native without the web CanvasKit bundle"). Web is unchanged (`public/canvaskit.wasm` still loaded before `OrbCanvas`). `npm run lint` still blocked by the pre-existing `unrs-resolver` native-binding failure.
- follow_ups: Render on device needs a dev-client rebuild (Skia is a native dep; not Expo Go). Verify `npx expo export --platform ios|android` no longer resolves `fs`, and `--platform web` still loads CanvasKit.

## [2026-09-13] change — full-panel generative assistant; voice STT reconciled; turn lock archived
- agent: opencode / deepseek-flash (implementation delegated to a general sub-agent in parallel; spec reconciliation and archive performed in the main session)
- requirements: `openspec/changes/archive/2026-09-13-replace-assistant-chat-with-fullscreen-generative-ui`, `.../2026-09-13-add-assistant-voice-transcription`, `.../2026-09-13-serialize-assistant-turns`; capabilities `mobile/assistant`, `mobile/a2ui-engine`, `mobile/voice`
- invariants: none (screen composition + client-side serialization; INV-010 HTTP-only preserved)
- files: `app/(tabs)/asistente.tsx`, `src/features/assistant-orb/{AnimatedOrb.tsx,SuggestedPrompts.tsx}`, `openspec/specs/mobile/{assistant,a2ui-engine,voice}/spec.md`, archived changes under `openspec/changes/archive/2026-09-13-*`
- decision: (1) The Soporte IA screen no longer keeps a chat/turn history. It renders either the idle header or exactly one full-panel A2UI surface, keyed by `surfaceId` with a `SlideInDown` entrance; each new surface replaces the previous one. A small floating `AnimatedOrb` (`variant="floating"`, 42%) plus a togglable text pill and cycling `SuggestedPrompts` keep the assistant reachable without dismissing the surface. Per explicit user decision, strict no-text: text-only backend replies (loan intake `response_text`, greeting `assistant_text`, loan success/failure) are not rendered anywhere. (2) `add-assistant-voice-transcription` was reconciled: its conflicting `mobile/assistant` delta (fixed header + scrolling chat history / transcript-as-chat-bubble) was deleted; only the on-device `es-MX` STT `mobile/voice` delta remains. (3) `serialize-assistant-turns` was confirmed already implemented in code (turn lock in `ui.store`, gated turns, mic/send mutual exclusion, leaf re-entrancy guards, `actionBus` lock) and its delta was folded into `mobile/assistant` + `mobile/a2ui-engine`.
- rationale: The agent's generated UI must be the experience, not a chat thread, and old surfaces bound to stale data models must not linger. Reconciling voice-transcription prevents re-introducing the chat layout. The turn lock prevents overlapping requests per conversation.
- impact: `tsc --noEmit` clean; `eslint` clean on touched files; `openspec validate --specs --strict` 6/6 green. The OpenSpec CLI could not move change directories into `openspec/changes/archive/` because the running Expo/Metro watcher holds the `openspec/changes` tree (Windows `EPERM` on directory rename); archives were done via copy+delete and the delta specs merged by hand (the archive workflow's agent-driven sync). Loan intake questions and the greeting text are now invisible by design (strict no-text).
- follow_ups: Manual on-device checks remain unchecked (replace `5.2`; serialize `5.3`–`5.6`; voice `1.3`/`5.x`). `add-assistant-orb-screen` and `add-assistant-initial-greeting` still carry ADDED `mobile/assistant` requirements that assume inline chat / greeting text and must be reconciled before archiving. Floating orb + text pill + suggested prompts need a visual pass on device.
## [2026-09-13] change — one Préstamos list + personalized per-loan pages
- agent: opencode / deepseek-flash
- requirements: `openspec/changes/personalized-loans-and-list` (proposed); backend loan-detail/list endpoints
- invariants: INV-023 untouched (additive REST); no A2UI wire change
- files: `src/api/{endpoints,types}.ts`, `src/features/loans/{loans,LoanCard,useLoanConsult}.ts(x)`, `app/(tabs)/prestamos.tsx`, `app/loan/[id].tsx`, `src/catalog/voz-color/{Text,Card,Badge,index}.ts(x)`, `openspec/changes/personalized-loans-and-list/`
- decision: The Préstamos tab now calls `GET /api/loans?user_id=` and renders created loans + active liabilities in one list; loan rows (source `loan`) navigate to a new `app/loan/[id].tsx` that renders the backend's personalized A2UI page with the catalog the backend chose (`amitie.voz-color.v1` → voz-color, else standard). The "Solicitar préstamo" modal now calls `POST /api/loans` and invalidates the list query instead of simulating an outcome. The accessible catalog's Text/Card/Badge honor `tone` (strong colors, larger type/targets) for the emoji/color audience. Also fixed the documented `useLoanConsult.send` `sessionIdOverride` parameter so the last pre-existing type error is gone.
- rationale: The list was reading liabilities, not loans, so it was empty. The detail page is lazy (backend creates once, hydrates with fresh data), so per-loan independent personalization costs one generation. Rendering with the backend-declared catalog lets a `simple` audience get voz-color even without an accessibility profile.
- impact: New OpenSpec change `personalized-loans-and-list` (`mobile/loans-list`, `mobile/loan-detail` ADDED; `mobile/catalog-accessible` updated). `npm run typecheck` clean (no remaining errors). `npx @fission-ai/openspec validate --all` 23/23. `npm run lint` still blocked by the pre-existing `unrs-resolver` native-binding failure. Depends on the backend change.
- follow_ups: Manual check: modal create → row appears → tap → personalized page; reopen re-hydrates; `u_don` gets the emoji/color page; private reason performs no research.

## [2026-09-13] fix — loan/liability detail pages: read-only summaries + Abonar
- agent: opencode / deepseek-flash
- requirements: `openspec/changes/personalized-loans-and-list` (proposed); backend per-credit detail endpoints
- invariants: no A2UI wire change (additive components/action)
- files: `src/a2ui/{registry,actionBus,context,renderer}.tsx`, `src/catalog/standard/{LoanSummary,LiabilitySummary,PlanTable,index}.tsx`, `src/catalog/voz-color/index.ts`, `src/api/{endpoints,types}.ts`, `app/loan/[id].tsx`, `app/liability/[id].tsx`, `app/(tabs)/prestamos.tsx`, `openspec/changes/personalized-loans-and-list/`
- decision: (1) Added dedicated read-only catalog components `LoanSummary` and `LiabilitySummary` (registered in both catalogs) so a taken credit/active debt is shown as information, never as an offer; (2) the loan detail screen no longer plays audio (detail pages are TTS-free); (3) new `app/liability/[id].tsx` renders the personalized liability surface and wires the client-routed `abonar` action (via a new `onAbonar` on `A2UISurface`/actionBus) to the existing `AbonoModal`; after paying, the detail query is invalidated so the page re-hydrates with the new balance; (4) the Préstamos list routes liability rows to the new screen (loans already routed to `/loan/[id]`); (5) `PlanTable` now reads the `balance` field so the loan distribution table renders its Saldo column.
- rationale: `LoanOffer` is an accept component, so it must never be used on an already-granted loan; the summaries give the detail pages a read-only visual. `abonar` is client-routed like `request_loan`, so it never hits `POST /api/action`.
- impact: New capability `mobile/liability-detail` and extended `mobile/loan-detail` in `personalized-loans-and-list`. `npm run typecheck` clean; `npx @fission-ai/openspec validate --all` 23/23. `npm run lint` still blocked by the pre-existing `unrs-resolver` native-binding failure. Depends on the backend change.
- follow_ups: Manual: tap a loan → no Aceptar, shows summary+distribution+risk; tap a liability → Abonar opens the modal and the balance refreshes; `u_don` gets the emoji/color layout.

## [2026-09-13] fix — no more `//` URLs, reliable greeting, feedback + mic, audio for all
- agent: opencode / deepseek-flash
- requirements: `openspec/changes/fix-api-base-url-and-assistant-greeting` (proposed)
- invariants: no A2UI wire change
- files: `src/api/{baseUrl,client,endpoints}.ts`, `src/state/ui.store.ts`, `src/features/voice/useSpeechToText.ts`, `app/(tabs)/asistente.tsx`, `app.config.ts`, `eas.json`, `openspec/changes/fix-api-base-url-and-assistant-greeting/`
- decision: (1) **Double-slash 404s**: the configured origin (a tunnel, possibly ending in `/`) was concatenated with `/api/...` in `client.ts` without trimming, so every `apiRequest` endpoint (message, greeting, profile, accounts, actions, payments) hit `host//api/...` and 404'd at the edge with no backend log; only the loans/audio paths trimmed. Fixed with one `src/api/baseUrl.ts::getApiBaseUrl()` that strips all trailing slashes, used by `client.ts`, `endpoints.ts`, and the Asistente screen; `app.config.ts` strips at build time too; `eas.json` value cleaned. (2) **Greeting reliability**: the greeting `useFocusEffect` marked the session greeted before the request and cancelled itself on any dep change/blur, so a cancelled greeting never retried; now `greetIfNeeded` marks the session greeted only on success and runs to completion. (3) **Watchdog + feedback**: `turnInFlight` records `turnStartedAt` and a 30 s watchdog force-releases a wedged lock; sends/mic while busy show a "terminando la respuesta anterior" bubble. (4) **Mic**: releasing always calls `speech.stop()` (even during a background turn); empty transcript → "no te escuché"; missing native STT module → "dictado no disponible". (5) **Audio for all**: removed the `catalogId === 'voz-color'` playback gates (backend now synthesizes for every user; see backend CHANGELOG).
- rationale: A trailing slash in a tunnel origin must not silently disable the assistant. The greeting/lock/mic fixes remove the intermittent "it looks like it's sending but nothing happens" states without queueing turns (feedback + watchdog, per product choice).
- impact: `npm run typecheck` clean; `npx @fission-ai/openspec validate --all` 24/24. `npm run lint` still blocked by the pre-existing `unrs-resolver` native-binding failure. Depends on the backend change for audio-for-all.
- follow_ups: Manual: force a trailing-slash base and confirm no `//`; greeting once per session for every persona incl. blur/refocus; busy send feedback; mic always ends; standard user hears audio.
