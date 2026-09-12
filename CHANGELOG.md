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
