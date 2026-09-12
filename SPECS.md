# SPECS.md — Business Requirements

> **Authority:** `INVARIANTS.md` > this file > `AGENTS.md`.
> This is the single structured list of business requirements the project must satisfy. Each requirement is testable. IDs are stable and must be referenced by tests, commits, and `CHANGELOG.md` entries.

## Requirement status legend
`[ ]` not started · `[~]` in progress · `[x]` satisfied · `[-]` cut

---

## 1. Interaction loop (foundation)

- [ ] **REQ-LOOP-01** — A user can express an intention or situation; the agent interprets it and retrieves relevant information through MCP before responding.
- [ ] **REQ-LOOP-02** — The agent emits the interface as A2UI messages; the frontend renders it using the team's custom catalog.
- [ ] **REQ-LOOP-03** — A user interaction with a generated component returns to the agent as context and can change the next decision and the next interface.
- [ ] **REQ-LOOP-04** — The experience never terminates after a single generated interface; at least two structural mutations occur in a session.
- [ ] **REQ-LOOP-05** — Every HTTP mutation endpoint returns a full A2UI message array.

## 2. La Mesa + El Revés (CORE)

- [ ] **REQ-LM-01** — On a debt-related intent, the agent retrieves liabilities, income streams, cash flow, and subscriptions through the `finance` MCP.
- [ ] **REQ-LM-02** — The agent selects a restructuring strategy (reasoned by the LLM) and emits a generated strategic choice interface (tradeoff control) rather than assuming the objective.
- [ ] **REQ-LM-03** — The plan is computed by the deterministic engine via `simulate_plan`; the LLM never computes amortization values.
- [ ] **REQ-LM-04** — The system detects when a plan fails within the horizon (`detect_plan_breaks`) and exposes the failure month.
- [ ] **REQ-LM-05** — When a plan fails, the agent emits a new, unprompted `BreakAlert` surface the user did not request. **(Mutation #1)**
- [ ] **REQ-LM-06** — The agent proposes a repair, re-simulates, and re-flows the plan interface, clearing the break. **(Mutation #2)**
- [ ] **REQ-LM-07** — `El Revés`: two personas (`bank` and `advocate`) negotiate over at least two rounds; each round is emitted as an A2UI update and recorded in `negotiation_rounds`.
- [ ] **REQ-LM-08** — The user can seize the negotiation via a "take control" action, replacing the advocate persona with direct edits.
- [ ] **REQ-LM-09** — Accepting an offer executes an MCP action and emits a final confirmed-plan interface with next steps.

## 3. Saving Bags (SECONDARY CORE)

- [ ] **REQ-BAG-01** — A user can create a saving bag by name.
- [ ] **REQ-BAG-02** — The agent infers a question set from the bag name and emits it as a generated A2UI form (not a fixed questionnaire).
- [ ] **REQ-BAG-03** — The system researches real average costs (e.g., flights and trip costs for a travel bag) via Gemini with Google Search grounding.
- [ ] **REQ-BAG-04** — Research results are cached as an immutable snapshot in `saving_bag_research`; live research runs only on create/refresh.
- [ ] **REQ-BAG-05** — If grounding fails or times out, a deterministic fallback price table produces the estimate.
- [ ] **REQ-BAG-06** — The agent compares the researched estimated total against the user's declared goal and surfaces the gap.
- [ ] **REQ-BAG-07** — The agent computes feasibility and a projected completion date from mocked financial reality (transactions, income trends, subscriptions, liabilities).
- [ ] **REQ-BAG-08** — The saving-bag UI is persisted and can be re-fetched; re-fetching reflects updated data and may mutate the interface when financial reality changes.

## 4. Voz y Color (automatic accessibility)

- [ ] **REQ-ACC-01** — Account flags in `accessibility_profiles` automatically activate accessible mode (elderly, blind, other needs, low literacy).
- [ ] **REQ-ACC-02** — In accessible mode the agent selects the dedicated `voz-color` catalog (high contrast, icon-first, large targets).
- [ ] **REQ-ACC-03** — Every emitted surface in accessible mode includes a speech payload; audio is generated via the `voice` MCP and returned as an audio reference.
- [ ] **REQ-ACC-04** — User audio input is transcribed (Gemini STT, fallback faster-whisper) and interpreted by the agent to determine the next step.
- [ ] **REQ-ACC-05** — Synthesized audio is cached by text hash so repeat runs are fast and resilient.
- [ ] **REQ-ACC-06** — Non-flagged users receive the standard catalog, making the adaptability visible by contrast.

## 5. Caja de Cristal (transparency)

- [ ] **REQ-CC-01** — Generated financial surfaces can include a "why you are seeing this" panel that exposes the assumptions and data used.
- [ ] **REQ-CC-02** — At least one assumption is editable by the user; editing it causes the agent to rebuild the outcome.

## 6. Kill Test (proof)

- [ ] **REQ-KT-01** — A debug endpoint serves a persisted, hydrated UI with frozen data and no agent involvement.
- [ ] **REQ-KT-02** — The Kill Test output must be the genuine stored artifact, never re-generated or staged.

## 7. UI persistence & hydration

- [ ] **REQ-UI-01** — Generated UIs are stored per user, associated to `loans_credits` or `saving_bag` and their entity, using placeholders.
- [ ] **REQ-UI-02** — The backend hydrates placeholders with current data immediately before delivery; stale values are never delivered.
- [ ] **REQ-UI-03** — A revalidation pass may mutate the stored structure; data-only changes are insufficient.
- [ ] **REQ-UI-04** — Each stored UI carries a version that increments on structural change.

## 8. API contract (frozen)

- [ ] **REQ-API-01** `POST /api/session`
- [ ] **REQ-API-02** `POST /api/message` — `{session_id, text|audio_b64}` → `{a2ui[], surface_id, audio_ref?}`
- [ ] **REQ-API-03** `POST /api/action` — `{surface_id, name, source_component_id, context}` → `{a2ui[]}`
- [ ] **REQ-API-04** `GET /api/ui/{surface_id}` — hydration + revalidation → `{a2ui[]}`
- [ ] **REQ-API-05** Saving bags: `POST /api/saving-bags`, `GET /api/saving-bags[/{id}]`, `POST /api/saving-bags/{id}/answer`, `POST /api/saving-bags/{id}/refresh`
- [ ] **REQ-API-06** `POST /api/negotiation/{session}/turn`, `POST /api/negotiation/{session}/take-control`
- [ ] **REQ-API-07** `GET /api/audio/{asset_id}`
- [ ] **REQ-API-08** `GET /debug/kill-test/{surface_id}`, `GET /debug/trace/{trace_id}`

## 9. Data

- [ ] **REQ-DATA-01** — SQLite schema (portable across the local file backend and Cloudflare D1) covers: users, accounts, transactions, income_streams, subscriptions, liabilities, lender_policies, saving_bags, saving_bag_answers, saving_bag_research, saving_bag_plan, generated_ui, ui_actions, negotiation_rounds, accessibility_profiles, audio_assets, sessions, traces.
- [ ] **REQ-DATA-02** — A deterministic, re-runnable seed provides: one debt persona, one accessible persona, one travel saving bag, and at least six months of transaction/subscription history.
- [ ] **REQ-DATA-03** — Local development uses a local SQLite file; the showcase uses Cloudflare D1. The active backend is selected by `DB_BACKEND` with no source-code change.
- [ ] **REQ-DATA-04** — All persistence is reached through a repository port with interchangeable `local_sqlite` and `d1_http` adapters; the agent and MCP layers never issue backend-specific SQL.
- [ ] **REQ-DATA-05** — D1 is accessed via the Cloudflare REST API using the account ID, the D1 database UUID (`CLOUDFLARE_D1_SQLITE`), and a scoped API token with `D1 Read`/`D1 Write`. No Cloudflare Workers binding dependency.
- [ ] **REQ-DATA-06** — Schema, migrations, and seed stay within the D1-compatible SQLite subset: positional `?` bindings only, ≤100 bound parameters and ≤100 KB per statement, rows <2 MB, no `ATTACH`, no unsupported PRAGMAs, and no `BEGIN`/`COMMIT` wrappers in import files. JSON is stored as TEXT.
- [ ] **REQ-DATA-07** — A single source of truth defines the schema and seed; the local and D1 backends must produce identical schema and seed data (verified by a parity test).
- [ ] **REQ-DATA-08** — If D1 is unreachable or over quota during the showcase, the system falls back to the local seeded SQLite backend so the demo survives; the fallback is always traced and never silent.

## 10. Non-functional

- [ ] **REQ-NFR-01** — Provider failover works without code changes and keeps development/demo alive on quota exhaustion (Gemini→DeepSeek, ElevenLabs→edge-tts, Gemini STT→faster-whisper, grounding→fallback table).
- [ ] **REQ-NFR-02** — Every request and every LLM/MCP call is traceable by `trace_id`.
- [ ] **REQ-NFR-03** — Modules can be built, run, and tested independently (isolated MCP servers; pure engine and hydration modules).
- [ ] **REQ-NFR-04** — `DEMO_MODE` pins the system to seeded data and cached responses if any provider degrades.
- [ ] **REQ-NFR-05** — The golden path completes in approximately 90 seconds.
- [ ] **REQ-NFR-06** — The database backend swap is environment-only, matching the provider-swap rule (INV-013/INV-019).
- [ ] **REQ-NFR-07** — D1 writes are batched and respect platform limits so the 90-second golden path holds despite D1 being single-threaded per database and every query being a network round trip.

## 11. Demo

- [ ] **REQ-DEMO-01** — The demo shows, in order: intent → MCP retrieval → generated UI → user interaction → returned context → BreakAlert mutation → repair/reflow → El Revés negotiation → accepted outcome.
- [ ] **REQ-DEMO-02** — A Saving Bag flow demonstrates a vague goal becoming a researched, dated, funded plan.
- [ ] **REQ-DEMO-03** — The accessible persona demonstrates the same agent producing a different catalog with audio in/out.
- [ ] **REQ-DEMO-04** — A recorded golden-path video exists as a fallback.

## 12. Explicitly out of scope

- Authentication / authorization systems.
- Production databases or real banking integrations.
- Payment rails or real money movement.
- Deployment infrastructure, microservices orchestration, or elaborate analytics.
- Third-party UI component libraries.

> **Scope change (2026-09-12):** "Native mobile applications (frontend is a web surface)" was removed from this list. The frontend is now a native mobile app (Expo/React Native) consuming the frozen REST contract in §8. See `MOBILE_ARCHITECTURE.md` and `CHANGELOG.md`.
