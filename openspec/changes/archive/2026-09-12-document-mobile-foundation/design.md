## Context

The mobile app (Expo SDK 57, React Native) was built in an earlier session before this repository adopted OpenSpec for the mobile frontend. Its architecture rationale lives in `MOBILE_ARCHITECTURE.md` (kept as the narrative "why" doc); this change's job is only to translate what was actually built into OpenSpec's baseline `specs/` format. See `CHANGELOG.md`'s `[2026-09-12] bootstrap` entry for the original build record, including the researched library decisions (NativeWind and Moti evaluated and dropped, SDK pinned to 57 via `npm view`, not guessed).

## Goals / Non-Goals

**Goals:**
- Make `openspec/specs/` accurately reflect the five capabilities that are genuinely done and match their intended behavior.
- Retire `MOBILE_SPECS.md` as a parallel, drifting source of truth.

**Non-Goals:**
- Does not baseline `mobile/dashboard` or `mobile/assistant` — both exist in code but were built without the Figma references and do not match them. Baselining them now would assert a false "this is correct and matches design" state. They get their own alignment changes.
- Does not add any new capability the code doesn't already have (no product-specific catalog components, no Kill Test viewer, no negotiation UI — all correctly absent from this baseline).

## Decisions

- **One change per logical unit of already-built work**, archived immediately, rather than trickling five tiny archived changes — keeps the git/openspec history readable.
- **Capability paths are `mobile/<name>`**, establishing the naming convention every subsequent mobile change should follow (`AGENTS.md` §2a rule 4).

## Risks / Trade-offs

- Retroactive documentation risks specs that describe intent rather than actual behavior. Mitigated by writing every requirement/scenario directly against the real files (`src/a2ui/`, `src/catalog/`, `app/login.tsx`) rather than from memory of what was intended.
