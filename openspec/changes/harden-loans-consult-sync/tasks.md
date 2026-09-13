## 1. Loans consult behavior

- [ ] 1.1 `app/(tabs)/asistente.tsx`: on `status === 'error'`, append a Spanish bubble mapped from `error_code` (fallback `message`), and expose retry when `retryable`.
- [ ] 1.2 Surface `loanConsult.errorMessage` in the loans conversation (never leave a consult failure silent).
- [ ] 1.3 `src/api/types.ts`: add `error_code`, `message`, `retryable` to `LoansConsultPayload`.
- [ ] 1.4 `src/features/loans/useLoanConsult.ts`: keep `sessionId`/`loanRequestId` in refs set synchronously by `greet`/`send`; export `loanErrorMessage`.
- [ ] 1.5 `src/api/endpoints.ts`: add an `AbortController` timeout (~8 s) to `loansGreeting`/`loansConsult` with a handled timeout error.
- [ ] 1.6 `src/catalog/standard/LoanOffer.tsx`: hide the accept affordance when `amount <= 0` (not-eligible).

## 2. Catalog components

- [ ] 2.1 `src/a2ui/registry.ts`: add `ScenarioComparison`, `PlanTable`, `ForecastChart`, `LineChart`, `BreakAlert` to `BasicNodeType`.
- [ ] 2.2 Implement `src/catalog/standard/ScenarioComparison.tsx` (scenarios, highlightIndex, title).
- [ ] 2.3 Implement `src/catalog/standard/PlanTable.tsx` (months, breakMonth; progressive preview).
- [ ] 2.4 Implement `src/catalog/standard/ForecastChart.tsx` and `LineChart.tsx` with `react-native-svg`; shared `charting.ts` accepts `value`/`y`/`balance`/`saldo` variants.
- [ ] 2.5 Implement `src/catalog/standard/BreakAlert.tsx` (month, shortfall, reasons, assumptions).
- [ ] 2.6 Register all five in `src/catalog/standard/index.ts` and re-export from `src/catalog/voz-color/index.ts`.

## 3. Audio ref correctness

- [ ] 3.1 `src/api/endpoints.ts::getAudioAssetUrl`: accept a bare `audio_id` or an absolute `audio_ref`; never prepend `/api/audio/` twice.
- [ ] 3.2 `useLoanConsult`: play `audio_id` (not `audio_ref`).

## 4. Verification

- [ ] 4.1 `npm run typecheck` clean.
- [ ] 4.2 `npm run lint` clean.
- [ ] 4.3 Manual: with `roberto`/`sofia`, consult reaches a terminal with `LoanOffer` + the new components rendering; confirm the offer.
- [ ] 4.4 Manual: with `demo`/`u_ana` (not eligible), the consult shows an explanatory bubble and no offer surface.
- [ ] 4.5 Manual: stop the backend (or force a slow response) and confirm a visible Spanish error + retry; consult round-trip stays within ~5 s in the server log.
- [ ] 4.6 Manual: accessible persona (`accesible`/`u_don`) auto-plays `/speech.audioRef` without a doubled `/api/audio/` path.
