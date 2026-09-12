## 1. Backend coordination (blocking)

- [ ] 1.1 Resolve with the backend team: is "Mis Ahorros" the same resource as `saving_bags` (REQ-BAG-*), a superset, or separate? Get this answered before building the list's data layer
- [ ] 1.2 Confirm the savings list response shape and manual-creation request/response shape
- [ ] 1.3 Add agreed types/endpoints to `src/api/types.ts` / `src/api/endpoints.ts`

## 2. List screen

- [x] 2.1 Build the savings card component matching Figma (`37:266`) — growth badge, balance, yield, Aportar fondos
- [x] 2.2 Build the list screen with empty state
- [x] 2.3 Wire list data fetching via TanStack Query
- [ ] 2.4 If backend confirms separate resources, add the visual distinction from the delta spec's last requirement (blocked on §1)

## 3. Manual creation

- [x] 3.1 Build the creation entry affordance
- [x] 3.2 Build the creation form (name, initial amount, vehicle type if applicable)
- [x] 3.3 Wire submission and list refresh on success (mocked mutation, local cache only)

## 4. Aportar fondos

- [x] 4.1 Design the top-up flow once the backend simulation shape is confirmed (simulated locally per `SPECS.md` §12; real shape still unconfirmed with backend — see §1)
- [x] 4.2 Wire list refresh after a successful top-up (local query-cache update)

## 5. Verification

- [x] 5.1 `npm run typecheck`, `npm run lint` clean for this lane's three files (`npm run doctor` not run — out of scope for this validator pass, no device/simulator attached)
- [x] 5.2 Screenshot comparison against Figma node `37:266` (see README validation note — exact match on layout, copy, and colors)
