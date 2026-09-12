## 1. Backend coordination (blocking)

- [ ] 1.1 Confirm with the backend team: loan list response shape, application request/response shape, payment action shape
- [ ] 1.2 Add the agreed types to a new `src/api/types.ts` section and endpoint functions to `src/api/endpoints.ts`, marked `INFERRED` until confirmed live

## 2. List screen

- [x] 2.1 Build the loan card component matching Figma (`37:160`) — status, balance, payment, progress bar, next payment date
- [x] 2.2 Build the list screen with empty state
- [x] 2.3 Wire list data fetching via TanStack Query

## 3. Manual application

- [x] 3.1 Build the "solicitar préstamo" entry affordance on the list screen
- [x] 3.2 Build the application form (amount, term, purpose)
- [x] 3.3 Wire submission and result state (approved/pending/rejected/needs more info)

## 4. Payment

- [ ] 4.1 Design the "Pagar ahora" flow once the backend payment-simulation shape is confirmed (not before)
- [ ] 4.2 Wire list refresh after a successful payment

## 5. Verification

- [ ] 5.1 `npm run typecheck`, `npm run lint`, `npm run doctor` clean
- [x] 5.2 Screenshot comparison against Figma node `37:160`
