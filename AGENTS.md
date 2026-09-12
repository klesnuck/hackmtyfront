# AGENTS.md — Project Context & Operating Rules

> **This file is the operating manual for humans and AI agents working on this repository.**
> It describes *what the project is*, *what stack we use*, and *how work must be done*.
>
> It does **not** contain core architecture decisions or business requirements.
> - Core, non-negotiable decisions → `INVARIANTS.md`
> - Business requirements (backend, frozen) → `SPECS.md`
> - Machine-readable change history → `CHANGELOG.md`
> - Mobile frontend architecture (why/design narrative) → `MOBILE_ARCHITECTURE.md` (+ `ARQUITECTURA_MOBILE.md`, its Spanish companion)
> - **Mobile frontend requirements (what, testable) → `openspec/` — see §2a. Not a root `.md` file.**
>
> **Authority order:** `INVARIANTS.md` > `SPECS.md` > `AGENTS.md` > `MOBILE_ARCHITECTURE.md` > `openspec/`.

---

## 1. What this project is

**La Mesa** is an AI-agent-driven financial application built for a bank hackathon in Mexico. The agent, not a fixed application, decides what interface the user needs and generates it in real time. Interfaces are described with **A2UI** and delivered as JSON; data and actions are exposed through **MCP**; the LLM is the center of the experience.

Two product pillars:

1. **La Mesa + El Revés (core).** The user describes a debt situation; the agent retrieves their real financial picture through MCP, chooses a restructuring strategy, asks the genuine tradeoff question, **detects that the plan breaks**, rebuilds the interface, and then negotiates on the user's behalf against a bank persona.
2. **Saving Bags (secondary).** The user names a goal (e.g. "viaje a Japón"); the agent infers clarifying questions, researches real average costs, compares them to the user's stated goal, and produces a dated plan grounded in the user's actual (mocked) cash flow. It offers the user loans (redirecting the user to La Mesa) to complete the goal based on specific situation (like almost reaching the deadline or the user wanting to reduce the previously set goal).

Plus automatic accessibility (`Voz y Color`), transparency (`Caja de Cristal`), and the `Kill Test` that proves the experience collapses without the LLM.

The financial problem must be genuine. Avoid the generic, predictable ideas this hackathon explicitly warns against (see §2).

---

## 2. Hackathon context (external, fixed)

- **Challenge:** AI agents that generate interfaces in real time for an open financial-services use case. **MCP is required. A2UI is mandatory and non-negotiable.**
- **The LLM must be central:** it interprets intent, reasons about context, makes decisions, orchestrates tools, and determines the interface. It cannot be an ornamental chatbot on a conventional app.
- **MCP must be architecturally meaningful:** it provides data, tools, actions, and the data models of the solution. It must not exist to satisfy a checklist.
- **A2UI represents and transmits the interface.** The generated interface must be a consequence of the agent's reasoning, not a collection of predetermined screens.
- **Judging priority (optimize in this exact order):**
  1. Fulfillment and usefulness for the user
  2. Quality and adaptability of the generated UI
  3. Quality of the AI solution
  4. Architecture and engineering
  5. UX and design
  6. Innovation
  7. Presentation, pitch, and showcase
- **Targeting zones:** Personal Banking, Investments, Loans and Credits, Payments, Insurance, Financial Education. This project lives primarily in **Loans and Credits** and **Personal Banking / Financial Education**.
- **Data:** synthetic, simulated, or public. Data realism matters less than idea quality, usefulness, agent behavior, generated UI, and the interaction loop.
- **MVP constraints:** 4 developers, ~24 working hours over 3 days. Languages available: React + TypeScript, C++, Java, Kotlin + Compose Multiplatform, Python. Prefer mocked infrastructure. Do not build auth, production databases, deployment infrastructure, complex microservices, elaborate analytics, native mobile apps, payment rails, or enterprise security. Cloudflare D1 is used only as a managed SQLite **showcase host** for mocked data; it is not a production database integration and does not violate this constraint.

### Forbidden patterns
Do not build static reports, static dashboards, one-shot generated pages, predetermined screens disguised as generated UI, read-only visualizations, LLM responses that merely populate a fixed frontend, or a chatbot followed by a conventional application. If removing the LLM leaves essentially the same UI and workflow, the architecture is wrong.

### Anti-fluff rule
Never describe work as innovative, revolutionary, disruptive, personalized, intelligent, agentic, or adaptive unless the implementation provides concrete evidence. Replace adjectives with observable behavior.

---

## 2a. Spec-driven development via OpenSpec (mobile frontend)

**This repository's mobile frontend requirements live in `openspec/`, not in a root `.md` file.** `openspec` (the CLI, `@fission-ai/openspec`) is installed globally and initialized here (`openspec/config.yaml`, schema `spec-driven`). This corrects an earlier mistake in this repo's history: a `MOBILE_SPECS.md` file was written directly at repo root instead of through OpenSpec — it has been retired and its content migrated into `openspec/specs/` and `openspec/changes/`. Do not recreate a root-level requirements `.md` file for the mobile app; propose a change instead.

**The model:**
- `openspec/specs/<capability>/spec.md` — the **current, deployed truth**. What the app actually does right now, one file per capability, `### Requirement:` + `#### Scenario:` blocks (WHEN/THEN). Treat this the way `SPECS.md` REQ-* items are treated for the backend: testable, referenced in commits.
- `openspec/changes/<change-id>/` — a **proposed** delta before it's built: `proposal.md` (why/what), `specs/<capability>/spec.md` (delta — `## ADDED/MODIFIED/REMOVED/RENAMED Requirements`), `design.md` (how), `tasks.md` (checklist). Nothing here is deployed truth yet.
- `openspec archive <change-id>` folds an implemented change's delta specs into `openspec/specs/` and moves the change under `openspec/changes/archive/`.

**Rules of operation (mobile frontend work):**
1. **New capability or behavior change → propose first.** Use the `openspec-propose` skill (or `/opsx:propose`) to generate `proposal.md` + delta `specs/` + `design.md` + `tasks.md` before writing implementation code. Planning and implementation are separate steps — do not skip straight to code for anything beyond a trivial fix.
2. **Implementing an approved change → use `openspec-apply-change`** (or `/opsx:apply`), which works through `tasks.md`.
3. **Finishing a change → use `openspec-archive-change`** (or `/opsx:archive`), which folds the delta into `openspec/specs/` (deployed truth) and archives the change. Do not hand-edit `openspec/specs/` outside of archive/sync — use `openspec-sync-specs` if main specs need updating without a full archive.
4. **Capability naming:** kebab-case paths under `specs/`, e.g. `mobile/a2ui-engine`, `mobile/catalog-standard`, `mobile/loans-list`. Reuse an existing capability's exact path when modifying it; only invent a new path for something genuinely new.
5. **`openspec validate` before considering any change/spec work done.**
6. This section governs the **mobile frontend only** (this repository). The backend repository may have its own spec-driven setup — do not assume this section applies there.

---

## 3. Stack

**Backend (owned by a separate repository — not this one; consumed only via the frozen REST contract in `SPECS.md` §8; listed here for context so the mobile agent understands the whole system):**
- Python 3.11+, type hints throughout.
- FastAPI + Uvicorn for the HTTP API.
- Google ADK for agent orchestration.
- A2UI Python agent SDK (`a2ui-agent-sdk`) for schema management and validation.
- Python MCP SDK for the `finance`, `savings`, `ui`, and `voice` MCP servers.
- Persistence is abstracted behind a repository port (`INV-019`) with two adapters: local **SQLite** (stdlib `sqlite3`, development) and **Cloudflare D1** (showcase, via the Cloudflare REST API using `httpx`). No ORM; backend selection is environment-only.
- `wrangler` CLI is used only for D1 schema migrations and seed import/export (setup-time tool).
- `httpx` for outbound HTTP.
- **LLM:** Gemini (Google AI Studio / ADK) primary; DeepSeek (OpenAI-compatible) fallback.
- **TTS:** ElevenLabs primary; edge-tts fallback.
- **STT:** Gemini multimodal primary; faster-whisper fallback.

**Frontend (owned by this repository; native mobile app, see `MOBILE_ARCHITECTURE.md`):**
- **Expo (React Native) + TypeScript**, strict mode. Built and distributed via **EAS Build** (cloud, no local macOS/Xcode dependency) and **TestFlight** / Android internal testing / Expo Go for fast iteration.
- Custom A2UI catalog and renderer built on React Native primitives (`View`/`Text`/`Pressable`/`StyleSheet`). **No third-party UI component libraries** (no MUI, shadcn/ui, Chakra, Ant Design, React Native Paper, etc.). A utility styling engine (e.g. NativeWind) is permitted — it is not a component library — but is not mandatory.
- Consumes only the frozen REST contract in `SPECS.md` §8. `INV-010` (HTTP-only, no sockets) and `INV-023` (frozen contract, backend never depends on frontend internals) apply unchanged.

---

## 4. Repository layout

**This repository is frontend/mobile-only.** The backend lives in a separate repository and is reached exclusively over HTTP per the frozen contract in `SPECS.md` §8 — nothing below is scaffolded here.

For reference (so the mobile agent understands what it's talking to), the backend repository's own layout is:

```
/backend                (separate repository)
  api/            FastAPI routers (session, message, action, ui, saving_bags, negotiation, audio, debug)
  agent/          Gemini ADK orchestrator, intent router, persona controller, catalog selector, STT adapter
  providers/      base interfaces + gemini, deepseek, elevenlabs, edge_tts, faster_whisper, registry
  mcp/finance/    liabilities, income, cash flow, policies, actions
  mcp/savings/    bags, questions, research, feasibility, projection
  mcp/ui/         catalog resources, persist/hydrate/revalidate, a2ui_action
  mcp/voice/      synthesize_speech, list_voices, cache_audio
  engine/         deterministic amortization, break detection, feasibility, projection (pure, tested)
  hydration/      placeholder resolver + revalidation hook (pure, tested)
  db/             schema.sql, migrations/, seed.py, repositories/
  db/backends/    database port + local_sqlite and d1_http adapters
  wrangler.toml   D1 binding metadata + migrations dir (setup only; token stays in .env)
  observability/  trace middleware, structured logging, /debug/trace
  audio_cache/    pre-warmed TTS assets
  demo/           DEMO_MODE, golden-path seed, rehearsal harness
  .env.example    template only; real .env is git-ignored
```

**This repository's own layout** is the Expo app, at repo root (no `/mobile` nesting — the whole repo is the mobile app). Full detail in `MOBILE_ARCHITECTURE.md` §2.

> Only the root documents exist here as of 2026-09-12, plus a throwaway web prototype (from an earlier Figma-to-code test, predates the mobile-app decision) that still needs to be moved or deleted per `MOBILE_ARCHITECTURE.md` §0 before the Expo app is scaffolded at root.

---

## 5. Rules of operation for agents

1. **Read `INVARIANTS.md` before any change.** If a task would violate an invariant, stop and propose an invariant change instead of working around it.
2. **Append to `CHANGELOG.md`** for every meaningful change, decision, or fix. The changelog is append-only and written for future agents.
3. **Never silently change an invariant.** Invariant changes require explicit human approval and a changelog entry with rationale (see `INVARIANTS.md` §F).
4. **Keep the system modular.** New capabilities go behind an interface; do not couple the orchestrator to a specific provider, database call, or transport. Provider selection is env-only.
5. **MCP is the only door to data and actions.** Do not reach into the database backend (local SQLite or D1) from the agent or API layers; go through MCP.
6. **Never compute financial math in the LLM or in prompt logic.** Use `engine/`.
7. **Never deliver stale data.** Hydrate immediately before every response; revalidate structure when context may have changed.
8. **Prefer the smallest system that proves the thesis.** One extraordinary interaction over ten mediocre features.
9. **Do not commit, push, or open PRs unless explicitly asked.**
10. **Do not add secrets anywhere except `.env`.** See §8.

---

## 6. Code style

- **Python (backend, separate repository — reference only):** PEP 8, full type hints, small pure functions in `engine/` and `hydration/`, dependency injection over globals. Pydantic models at all boundaries (HTTP, MCP, providers). `async` for IO, synchronous pure functions for computation.
- **Naming:** stable `REQ-*` IDs from `SPECS.md` in tests and commits; `camelCase` for TypeScript, `PascalCase` for components.
- **Errors:** typed exceptions/results; never swallow a rejected fetch silently — surface it (see `MOBILE_ARCHITECTURE.md` §4's fallback-node rule for the UI-facing equivalent).
- **Logging:** structured logging only in dev builds. Never log secrets, raw audio, or full financial payloads.
- **Comments:** code should be self-documenting. Add a comment only when the *why* is non-obvious; do not narrate the *what*.
- **TypeScript (this repository):** strict mode, functional components, RN `StyleSheet`/NativeWind utilities, custom primitives (`src/catalog/`). No third-party UI component libraries — see `MOBILE_ARCHITECTURE.md`.
- **Formatting:** keep modules small and single-purpose; a file that needs scrolling to understand is a signal to split it.

---

## 7. Documentation-fetching rules

**Never guess an API, tool name, parameter, message shape, or provider behavior. Fetch the primary source first.**

Required sources, in priority order:

| Area | Source |
|---|---|
| A2UI protocol, catalogs, actions, MCP integration | https://a2ui.org/ (and its specification pages) |
| A2UI source / renderers / agent SDK | https://github.com/a2ui-project/a2ui |
| Model Context Protocol | https://modelcontextprotocol.io/ |
| Google ADK | https://google.github.io/adk-docs/ |
| Gemini API (text, multimodal, grounding) | https://ai.google.dev/gemini-api/docs |
| ElevenLabs API | https://elevenlabs.io/docs |
| FastAPI | https://fastapi.tiangolo.com/ |
| edge-tts | PyPI package documentation |
| faster-whisper | project repository documentation |
| Cloudflare D1 (SQL support, limits, REST API, migrations) | https://developers.cloudflare.com/d1/ |
| Wrangler D1 commands | https://developers.cloudflare.com/workers/wrangler/commands/d1/ |

Rules:
1. Fetch the official page before implementing an integration; do not rely on memory.
2. Record the version or spec revision used when it affects behavior (e.g., A2UI v0.9.1 vs v1.0 candidate) in the `CHANGELOG.md` entry — not in code comments.
3. Do not upgrade a protocol version or provider SDK without human approval and a changelog entry.
4. Prefer protocol-native mechanisms (A2UI data binding, `a2ui_action`, MCP resources/tools) over custom reimplementations.

---

## 8. Secrets & security

- All credentials (`GEMINI_API_KEY`, `DEEPSEEK_API_KEY`, `ELEVENLABS_API_KEY`, `CLOUDFLARE_API_TOKEN`, etc.) live only in `backend/.env`. Non-secret database configuration (`DB_BACKEND`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_D1_SQLITE` database UUID) also lives in `.env`.
- `.env` is git-ignored. `backend/.env.example` contains names and placeholders only.
- Never commit, log, echo, or document a secret. Never paste secrets into generated code.
- Any key disclosed outside `.env` is considered compromised and must be rotated after the event.
- Do not log raw audio or full financial payloads; log `trace_id` and metadata instead.

---

## 9. Testing & verification

- `pytest` for `engine/`, `hydration/`, and repository logic; deterministic and pure where possible.
- At least one acceptance test per `REQ-*` in `SPECS.md` for the golden path.
- A provider smoke test that asserts the failover chain activates on quota/rate-limit.
- A database parity test asserting the local schema and seed match the D1-compatible schema and seed (`REQ-DATA-07`).
- A D1-outage test asserting `d1_http` failures trigger the traced local SQLite fallback (`REQ-DATA-08`).
- Verify A2UI payloads with the A2UI agent SDK before they leave the backend.
- Run the golden path in `DEMO_MODE` before any rehearsal.
- When a task is complete, run the relevant tests and lint/type checks; if a check command is not yet defined, propose one and record it here.

---

## 10. Definition of done

A change is done when it:
1. satisfies or advances one or more `REQ-*` requirements,
2. violates no invariant,
3. is covered by a test or an explicit acceptance check,
4. keeps provider swaps env-only,
5. has an appended `CHANGELOG.md` entry describing the what, why, and impact,
6. leaves the golden path runnable end to end.
