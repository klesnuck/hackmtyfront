## 1. Backend coordination (blocking)

- [ ] 1.1 Resolve with the backend team: is "Mis Ahorros" the same resource as `saving_bags` (REQ-BAG-*), a superset, or separate? Get this answered before building the list's data layer
- [ ] 1.2 Confirm the savings list response shape and manual-creation request/response shape
- [ ] 1.3 Add agreed types/endpoints to `src/api/types.ts` / `src/api/endpoints.ts`

## 2. List screen

- [ ] 2.1 Build the savings card component matching Figma (`37:266`) — growth badge, balance, yield, Aportar fondos
- [ ] 2.2 Build the list screen with empty state
- [ ] 2.3 Wire list data fetching via TanStack Query
- [ ] 2.4 If backend confirms separate resources, add the visual distinction from the delta spec's last requirement

## 3. Manual creation

- [ ] 3.1 Build the creation entry affordance
- [ ] 3.2 Build the creation form (name, initial amount, vehicle type if applicable)
- [ ] 3.3 Wire submission and list refresh on success

## 4. Aportar fondos

- [ ] 4.1 Design the top-up flow once the backend simulation shape is confirmed
- [ ] 4.2 Wire list refresh after a successful top-up

## 5. Verification

- [ ] 5.1 `npm run typecheck`, `npm run lint`, `npm run doctor` clean
- [ ] 5.2 Screenshot comparison against Figma node `37:266`
