## 1. Tab shell

- [ ] 1.1 Create `app/(tabs)/_layout.tsx` with Expo Router `Tabs` (4 tabs, icons, active/inactive colors from `theme/tokens.ts`)
- [ ] 1.2 Move `app/dashboard.tsx` → `app/(tabs)/inicio.tsx` (or equivalent route name), update any internal links
- [ ] 1.3 Move `app/assistant.tsx` → `app/(tabs)/asistente.tsx`
- [ ] 1.4 Add route stubs `app/(tabs)/prestamos.tsx` and `app/(tabs)/apartados.tsx` (content from their own changes)
- [ ] 1.5 Update `app/index.tsx`'s post-session redirect to point at the new Inicio tab route

## 2. Dashboard header

- [ ] 2.1 Build the greeting header (time-of-day text, user name, initials avatar, bell icon)
- [ ] 2.2 Source the user's display name/initials from session state (fall back sensibly if absent)

## 3. AI banner

- [ ] 3.1 Build the dark promotional banner card matching Figma copy/colors
- [ ] 3.2 Wire its tap target to navigate to the Soporte IA tab

## 4. Balance card

- [ ] 4.1 Create a mock account data module (balance, masked account number, CLABE)
- [ ] 4.2 Build the balance card UI matching Figma
- [ ] 4.3 Wire the CLABE copy icon to the clipboard

## 5. Quick actions

- [ ] 5.1 Build the 3-icon quick-actions row (Ahorros/Préstamos/Transferir)
- [ ] 5.2 Wire each to its destination (Apartados tab, Préstamos tab, transfer flow)

## 6. Verification

- [ ] 6.1 `npm run typecheck`, `npm run lint`, `npm run doctor` all clean
- [ ] 6.2 Screenshot comparison against Figma node `37:42` for the Inicio tab
- [ ] 6.3 Confirm tab state preservation when switching tabs mid-flow
