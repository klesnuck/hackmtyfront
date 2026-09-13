## Why

The **Préstamos** tab shows nothing after a credit is created: it calls
`GET /api/liabilities` (existing debts), so AI-created loans — which live in the
`loans` table — never appear, and a user with no active liabilities sees the empty
state. There is also no way to open a specific credit.

Separately, each credit deserves a page of its own, built for that user. Today the
only generated loan surface is the shared consult terminal (`domain='loans_credits'`).
The requirement is a **per-loan** A2UI page that is lazily created once and then
re-hydrated with fresh data on every visit, extremely personalized: low-literacy /
elderly / accessibility users get a color + emoji interface, and interface density
scales with the user's real financial activity. The user's reason for the credit
(collected during intake, with a **private** option) grounds the page in a web
search about that topic — unless private, in which case no online search runs.

## What Changes

- **One unified list.** `GET /api/loans?user_id=` returns created loans + active
  liabilities in one list (`source: 'loan' | 'liability'`). The tab renders both;
  loan rows are tappable and open the per-loan page.
- **Real "Solicitar préstamo".** The manual modal now calls `POST /api/loans`
  (previously a simulated UI) and refreshes the list.
- **Purpose + private.** Intake already asks why; it now explicitly offers
  "es privado". The choice is persisted on the created loan (`purpose`,
  `purpose_private`).
- **Per-loan detail page.** `GET /api/loans/{loan_id}/ui` finds the stored
  `generated_ui` template for `(user, domain='loan_detail', entity_id=loan_id)`
  and hydrates it; if missing, generates it once and persists it. Templates store
  `{{placeholders}}` / `/loan/*` bindings; hydration re-derives loan values from
  the live `loans` row (no stale data).
- **Audience-driven, color/emoji when needed.** The accessible `voz-color` catalog
  is pinned not only for an accessibility profile but also for a `simple` audience;
  `voz-color` Text/Card/Badge become tone-colored. Interface complexity follows the
  deterministic audience level + a numeric `activityScore`.
- **Purpose research.** A generalized `research_topic` on the research provider
  (Gemini Google-Search grounding, static fallback) returns a topical cost
  breakdown; it is shown in financial terms. `purpose_private` skips it entirely
  while the page stays fully personalized from the user's own data.

## Capabilities

### New Capabilities
- `mobile/loans-list`: one list of created loans + active liabilities, with the
  manual application wired to the real create endpoint.
- `mobile/loan-detail`: the personalized, lazily created + re-hydrated per-loan
  A2UI page.

### Modified Capabilities
- `mobile/catalog-accessible`: `voz-color` Text/Card/Badge are tone/color-first,
  and the accessible catalog is selected for a `simple` audience as well.

## Impact

- Frontend: `src/api/{endpoints,types}.ts`, `src/features/loans/{loans,LoanCard,useLoanConsult}.ts(x)`,
  `app/(tabs)/prestamos.tsx`, new `app/loan/[id].tsx`,
  `src/catalog/voz-color/{Text,Card,Badge,index}.ts(x)`.
- Backend (separate repo): `db/schema.{sql,py}`, `mcp_servers/finance/{service,server}.py`,
  `mcp_servers/ui/{service,server}.py`, `hydration`/`ui` loan context,
  `agent/{loans,loan_detail}.py`, `providers/research.py`, `engine/audience.py`,
  `api/routers/loans.py`, `api/{schemas,app,dependencies}.py`.
- No invariant or wire-protocol change: additive REST endpoints; A2UI stays v0.9.
- Verification: backend suite green; `npm run typecheck`; `openspec validate`.
