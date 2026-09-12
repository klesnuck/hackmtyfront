## Purpose

The transfer-money flow: move (simulated) funds between the user's own accounts or to a third party, reachable from the dashboard's "Transferir" quick action — no Figma reference yet; specified from product intent and standard bank-transfer UX.

## ADDED Requirements

### Requirement: Destination selection
The system SHALL let the user choose a transfer destination: one of their own accounts, or a third party identified by CLABE/account number and (for a new third party) a nickname to save for next time.

#### Scenario: Transfer to own account
- **WHEN** the user selects "a mis cuentas" and picks a destination account
- **THEN** the flow proceeds to amount entry with that account as the destination

#### Scenario: Transfer to a new third party
- **WHEN** the user enters a CLABE/account number not previously used
- **THEN** the flow validates its format before proceeding, and offers to save it with a nickname for future transfers

### Requirement: Amount entry validates against available balance
The system SHALL prevent submitting a transfer amount greater than the source account's available balance, showing a clear inline error rather than allowing submission.

#### Scenario: Insufficient balance
- **WHEN** the entered amount exceeds the source account's available balance
- **THEN** the submit action is disabled and an inline message explains why

### Requirement: Confirmation step before submission
The system SHALL show a review/confirmation screen (source, destination, amount) before the transfer is submitted, requiring an explicit confirm action.

#### Scenario: Reviewing before confirming
- **WHEN** the user reaches the review step
- **THEN** they see the source account, destination, and amount, and must explicitly confirm before anything is submitted

### Requirement: Result state and balance reflection
The system SHALL show a clear success or failure result after submission, and on success, update the source account's balance everywhere it's displayed (e.g. the dashboard balance card) without requiring an app restart.

#### Scenario: Successful transfer updates the dashboard
- **WHEN** a transfer completes successfully
- **THEN** the dashboard's balance card reflects the new balance the next time it's viewed, without a manual refresh

#### Scenario: Failed transfer
- **WHEN** a transfer fails (simulated failure, network error, etc.)
- **THEN** the user sees a clear failure state with the option to retry, and the source balance is not changed

### Requirement: Transfers are simulated, not real money movement
The system SHALL treat every transfer as a simulated/mocked operation against backend-held mock data, never integrating with a real payment rail or moving real funds, per `SPECS.md` §12.

#### Scenario: No real payment integration
- **WHEN** a transfer is submitted
- **THEN** it is processed entirely by the mocked backend, with no call to any real banking/payment API
