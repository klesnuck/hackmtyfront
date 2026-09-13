## 1. Backend

- [x] 1.1 `AgentService.greeting(user_id)`: `get_profile` via MCP → personalized text; `synthesize_speech` only for accessible users.
- [x] 1.2 `api/schemas.py`: `AgentGreetingRequest { session_id }`.
- [x] 1.3 `api/routers/agent.py`: `POST /api/agent/greeting` (404 unknown session) → `AgentResponse`.
- [x] 1.4 Register the router in `api/app.py`.
- [x] 1.5 `tests/test_agent_greeting.py`: accessible → audio_ref; standard → no audio_ref; unknown session → 404.
- [x] 1.6 Docs: REQ-API-12 in `SPECS.md`, endpoint in `API_KNOWLEDGE.md`, `CHANGELOG.md`.

## 2. Frontend

- [x] 2.1 `src/api/types.ts`: `AgentGreetingResponse`.
- [x] 2.2 `src/api/endpoints.ts`: `agentGreeting(sessionId)`.
- [x] 2.3 `app/(tabs)/asistente.tsx`: focus effect greets when no intent, session present, no conversation, once per session; renders `assistant_text`; auto-plays `audio_ref` for `voz-color`.
- [x] 2.4 Fix the initial-intent guard to wait for `sessionId` before consuming the one-shot.
- [x] 2.5 `src/features/voice/audioCache.ts`: retry the playback-mode switch once (recognized-then-reply timing).
- [x] 2.6 `app/(tabs)/asistente.tsx`: if the greeting endpoint is missing (404) or unreachable (status 0), fall back to an initial `/api/message` turn so the tab always starts.

## 3. Verification

- [ ] 3.1 `u_don` (`accesible`): open the Asistente tab (bottom nav) → immediate `POST /api/agent/greeting`, greeting text renders, mp3 plays with no mic use.
- [ ] 3.2 Open from the Inicio banner → identical.
- [ ] 3.3 Then speak a turn → the reply audio plays.
- [ ] 3.4 `u_ana` (`demo`): greeting text renders, no audio, no crash.
- [ ] 3.5 Backend serving the app includes `POST /api/agent/greeting` (restart/redeploy; `GET /openapi.json` lists it).
- [ ] 3.6 With the greeting route intentionally absent → the tab still starts via `/api/message` (no dead screen).
- [ ] 3.7 `npm run typecheck` / `npm run lint`.
