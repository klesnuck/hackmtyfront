## 1. Backend coordination (blocking)

- [ ] 1.1 Confirm with the backend team: own-accounts list shape, third-party recipient storage, transfer submission/result shape
- [ ] 1.2 Add agreed types/endpoints to `src/api/types.ts` / `src/api/endpoints.ts`

## 2. Destination selection

- [x] 2.1 Build own-account selection UI
- [x] 2.2 Build third-party entry (CLABE/account number, syntactic validation, nickname + save)

## 3. Amount + confirmation

- [x] 3.1 Build amount entry with available-balance validation
- [x] 3.2 Build the confirmation/review screen

## 4. Submission + result

- [x] 4.1 Wire submission and success/failure result states
- [ ] 4.2 Invalidate/update the dashboard balance query on success

## 5. Verification

- [ ] 5.1 `npm run typecheck`, `npm run lint`, `npm run doctor` clean
- [ ] 5.2 Confirm dashboard balance updates after a successful transfer without a manual refresh
- [ ] 5.3 Confirm insufficient-balance and failed-transfer states behave correctly
