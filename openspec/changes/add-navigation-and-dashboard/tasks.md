## 1. Tab shell

- [x] 1.1 Create `app/(tabs)/_layout.tsx` with Expo Router `Tabs` (4 tabs, icons, active/inactive colors from `theme/tokens.ts`)
- [x] 1.2 Rebuild `app/(tabs)/inicio.tsx` as the new Figma dashboard content (see §2-5) — this is a new file, not a move; the old `app/dashboard.tsx` content is relocated per 1.3a, not merged in here
- [x] 1.3a Move `app/dashboard.tsx`'s existing content (La Mesa / Saving Bags picker + "Habla con tu asistente" CTA) to `app/asistente-prestamos.tsx`, unchanged except: add a back-chevron header (it's now a pushed stack screen, not a tab root) and repoint its assistant navigation target from `/assistant` to `/asistente`. Delete `app/dashboard.tsx` once moved. See `design.md` "Repurposing decision".
- [x] 1.3 Move `app/assistant.tsx` → `app/(tabs)/asistente.tsx` (verified only at the filesystem level — `app/assistant.tsx` is gone and `app/(tabs)/asistente.tsx` exists; this is lane B's file per `WORKFLOW.md`'s ownership table, so its *content* wasn't reviewed by this validator)
- [ ] 1.4 Add route stubs `app/(tabs)/prestamos.tsx` and `app/(tabs)/apartados.tsx` (content from their own changes) — not lane A's to build per `WORKFLOW.md`'s lane table (owned by lanes D/E respectively, which build full content directly rather than a separate stub step); left unchecked here since lane A didn't touch these files
- [x] 1.5 Update `app/index.tsx`'s post-session redirect to point at the new Inicio tab route (`/inicio`)

## 2. Dashboard header

- [x] 2.1 Build the greeting header (time-of-day text, user name, initials avatar, bell icon)
- [ ] 2.2 Source the user's display name/initials from session state (fall back sensibly if absent) — not fully done: `SessionResponse` (`src/api/types.ts`) only carries `session_id` + `accessibility_profile`, no display-name field, so there is nothing in session state to source from yet. A `MOCK_DISPLAY_NAME` constant stands in, with a real fallback path (`getDisplayName` falls back to `'Usuario'`). Left unchecked pending the same backend coordination flagged in `proposal.md`'s Impact section.

## 3. AI banner

- [x] 3.1 Build the dark promotional banner card matching Figma copy/colors ("Asistente de Préstamos IA")
- [x] 3.2 Wire its tap target to `router.push('/asistente-prestamos')` — **not** the Soporte IA tab (superseded 2026-09-12, see `design.md` "Repurposing decision"); that screen is the intermediate picker that hands the user off to the assistant with a specific intent already attached

## 4. Balance card

- [x] 4.1 Create a mock account data module (balance, masked account number, CLABE)
- [x] 4.2 Build the balance card UI matching Figma
- [x] 4.3 Wire the CLABE copy icon to the clipboard

## 5. Quick actions

- [x] 5.1 Build the 3-icon quick-actions row (Ahorros/Préstamos/Transferir)
- [x] 5.2 Wire each to its destination (Apartados tab, Préstamos tab, transfer flow)

## 6. Verification

- [ ] 6.1 `npm run typecheck`, `npm run lint`, `npm run doctor` all clean — lint is clean; typecheck has 2 errors, neither a lane-A implementation bug (see README validation note); `expo-doctor` reports one pre-existing, repo-wide failure (duplicate `pnpm-lock.yaml`/`package-lock.json`) unrelated to any lane-A file. Left unchecked since not literally all-clean.
- [ ] 6.2 Screenshot comparison against Figma node `37:42` for the Inicio tab — no simulator/device is attached in this environment, so no rendered app screenshot could be taken; this validator instead compared the Figma `get_design_context`/`get_screenshot` output directly against `app/(tabs)/inicio.tsx`'s source (see README validation note for findings). Left unchecked since it isn't the literal device-screenshot check this item describes.
- [ ] 6.3 Confirm tab state preservation when switching tabs mid-flow — requires a running device/simulator, none attached.
