## Purpose

The transfer-money flow: move real, persisted funds between the user's own accounts or to a saved/new recipient by CLABE, reachable from Inicio's "Transferir" quick action, styled after a real bank app's transfer UX (Banorte-style tabs).

## ADDED Requirements

### Requirement: Two explicit transfer modes
The system SHALL present the Transferencias screen as two distinct modes the user picks between (a segmented control or equivalent, not a single merged list): "Transferir a otros" and "Transferir entre mis cuentas".

#### Scenario: Switching modes preserves nothing sensitive
- **WHEN** the user switches from one tab to the other
- **THEN** any in-progress destination/amount selection from the previous tab is discarded, not carried over

### Requirement: Transfer to others — new recipient
In "Transferir a otros", the system SHALL offer a "Transferir a nuevo destinatario +" entry point that collects a CLABE, a bank name, and an alias, with an option to save the recipient for future transfers.

#### Scenario: New recipient with a valid CLABE
- **WHEN** the user enters an 18-digit CLABE that passes the standard mod-10 checksum, a bank name, and an alias, and continues
- **THEN** the flow proceeds to amount + motivo entry with that recipient as the destination

#### Scenario: Invalid CLABE is rejected before continuing
- **WHEN** the entered CLABE is not 18 digits or fails the checksum
- **THEN** the continue action is disabled and an inline error explains why, matching the same validation the backend re-checks on submit

#### Scenario: Saving a new recipient
- **WHEN** the user leaves "guardar" enabled and completes a transfer to a new recipient
- **THEN** the recipient is persisted and appears under "Mis destinatarios" the next time this screen is opened, without a manual refresh

### Requirement: Transfer to others — saved recipients
In "Transferir a otros", the system SHALL show a "Mis destinatarios" list of the user's previously saved recipients (alias and masked CLABE), fetched from the backend, not from local/mock storage.

#### Scenario: Picking a saved recipient
- **WHEN** the user taps a saved recipient
- **THEN** the flow proceeds directly to amount + motivo entry with that recipient as the destination, skipping the CLABE/bank/alias form

#### Scenario: No saved recipients yet
- **WHEN** the user has no saved recipients
- **THEN** the "Mis destinatarios" section shows an empty state rather than an empty list with no explanation

### Requirement: Transfer between own accounts
In "Transferir entre mis cuentas", the system SHALL present the user's real accounts (from the backend) as both an origin and a destination picker, preventing the same account from being selected on both sides.

#### Scenario: Only one account exists
- **WHEN** the signed-in persona has fewer than two accounts
- **THEN** the mode shows a clear explanation that a second account is required, instead of a picker with no valid destination

#### Scenario: Selecting the same account twice
- **WHEN** the user has selected an account as the origin
- **THEN** that same account is not selectable (or is visibly disabled) as the destination

### Requirement: Amount and motivo entry validates against available balance
Both transfer modes SHALL require an amount and a motivo (memo/concept) before continuing, and SHALL prevent continuing with an amount greater than the origin account's real, current available balance.

#### Scenario: Insufficient balance
- **WHEN** the entered amount exceeds the origin account's available balance
- **THEN** the continue action is disabled and an inline message explains why

#### Scenario: Missing motivo
- **WHEN** the motivo field is empty
- **THEN** the continue action is disabled

### Requirement: Confirmation step before submission
The system SHALL show a review/confirmation screen (origin, destination, amount, motivo) before the transfer is submitted, requiring an explicit confirm action.

#### Scenario: Reviewing before confirming
- **WHEN** the user reaches the review step
- **THEN** they see the origin account, destination, amount, and motivo, and must explicitly confirm before anything is submitted to the backend

### Requirement: Transfers are real and persisted
The system SHALL submit every transfer to the backend as a real operation against the persisted database: a successful transfer actually reduces the origin account's stored balance and, when the destination is one of the user's own accounts, increases that destination account's stored balance by the same amount. A transfer to an external recipient (CLABE not belonging to the user) only debits the origin account.

#### Scenario: Own-account transfer updates both balances everywhere they're shown
- **WHEN** a transfer between the user's own accounts completes successfully
- **THEN** both the origin and destination account balances shown elsewhere in the app (e.g. Inicio's balance card, this screen's own account pickers) reflect the new values the next time they're read, without requiring an app restart

#### Scenario: External transfer only debits the origin account
- **WHEN** a transfer to a saved/new external recipient completes successfully
- **THEN** only the origin account's balance decreases; no other account in the system changes

#### Scenario: Backend rejects an invalid or unaffordable transfer
- **WHEN** the backend determines the amount exceeds the real current balance, or the destination account/CLABE is invalid, at the moment of submission (not just what the client validated earlier)
- **THEN** the transfer is rejected, no balance changes, and the user sees a clear failure state with the reason and the option to retry

## REMOVED Requirements

### Requirement: Transfers are simulated, not real money movement
**Reason**: This requirement was written before the backend exposed any persisted, real financial data. The rest of the app (Préstamos' "Abonar", Inicio's balance card) already treats the seeded backend accounts as the real source of truth and mutates them for real; leaving transfers as a pure client-side simulation made this screen the one place in the app where nothing the user does has any lasting effect, which is the exact "hardcoded card" problem the user asked to fix everywhere else. This never reached `openspec/specs/` (the change that introduced it, `add-transfers`, was written but never applied/archived), so there is no prior main-spec text to reconcile — it is removed here for the record and to make the reversal explicit.
**Migration**: See "Transfers are real and persisted" above. No user-facing migration is needed since the simulated version was never released against real accounts.
