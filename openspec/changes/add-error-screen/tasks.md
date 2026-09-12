## 1. Component

- [ ] 1.1 Build `ErrorScreen` matching Figma (`37:351`): icon badge, heading, message, code tag, primary button, support link
- [ ] 1.2 Accept `code`, `message` (optional override), and an `onPrimaryAction` prop (defaults to "Volver al inicio" navigation)

## 2. Error code registry

- [ ] 2.1 Define the initial set of error codes covering known failure paths (session bootstrap failure, network unreachable, unexpected server error)
- [ ] 2.2 Document the convention (`ERR_<area>_<number>`) alongside the component

## 3. Adoption

- [ ] 3.1 Wire the session-bootstrap failure path (`app/index.tsx` / login) to use it if session creation fails unrecoverably
- [ ] 3.2 Document the recoverable-vs-unrecoverable rule where other changes (loans, savings, transfers) are likely to need it

## 4. Verification

- [ ] 4.1 `npm run typecheck`, `npm run lint`, `npm run doctor` clean
- [ ] 4.2 Screenshot comparison against Figma node `37:351`
- [ ] 4.3 Confirm "Volver al inicio" recovers correctly both with and without an active session
