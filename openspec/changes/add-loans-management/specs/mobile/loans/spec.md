## Purpose

The Préstamos tab: a list of the user's active loans and a manual loan application flow, so a user can manage credit like in any bank app, not only through an AI conversation.

## ADDED Requirements

### Requirement: Active loans list matches Figma
The system SHALL show one card per active loan with: loan name, a status label ("Al corriente" or an overdue variant), remaining balance, monthly payment, a payment-progress bar with percentage, a divider, the next payment date, and a "Pagar ahora" affordance — matching Figma node `37:160`.

#### Scenario: Multiple active loans
- **WHEN** the user has more than one active loan
- **THEN** each renders as its own card in the order the backend returns them, scrollable if they exceed the screen height

#### Scenario: No active loans
- **WHEN** the user has no active loans
- **THEN** the list shows an empty state (not an error, not a blank screen) inviting the user to apply for one

### Requirement: "Pagar ahora" initiates a payment
The system SHALL treat "Pagar ahora" as the entry point to a payment action for that specific loan (exact flow — in-app confirmation vs. handoff — defined during implementation once the backend contract exists).

#### Scenario: Tapping Pagar ahora
- **WHEN** the user taps "Pagar ahora" on a loan card
- **THEN** the app begins the payment flow for that loan's id

### Requirement: Manual loan application
The system SHALL let a user start a loan application without going through the AI assistant conversation, from an affordance on the Préstamos tab (e.g. an "add"/"solicitar" action), collecting at minimum: desired amount, term, and purpose, and submitting it for backend evaluation.

#### Scenario: Starting a manual application
- **WHEN** the user taps the "solicitar préstamo" affordance
- **THEN** they're taken to a form collecting amount, term, and purpose, independent of any assistant conversation

#### Scenario: Submitting a manual application
- **WHEN** the user submits a complete application form
- **THEN** the app sends it to the backend and shows the resulting status (approved/pending/rejected/needs more info) rather than assuming success

### Requirement: List data refreshes after a relevant action
The system SHALL refetch or update the loans list after a payment or a new application completes, so the list never shows stale state after the user takes an action.

#### Scenario: After a successful payment
- **WHEN** a payment completes successfully
- **THEN** the affected loan card's balance/progress updates without requiring the user to manually pull-to-refresh
