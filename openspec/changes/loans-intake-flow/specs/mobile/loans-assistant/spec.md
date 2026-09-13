## ADDED Requirements

### Requirement: The assistant collects the amount and purpose before offering
When a loans consultation does not yet know the amount the user wants (and the
user has not asked for the maximum), the system SHALL ask, in a natural
one or two-sentence turn that acknowledges what the user already said, for the
missing amount and/or purpose, and SHALL return no terminal offer. It SHALL NOT
build, persist, or show an offer until the amount is known. The clarifying
question SHALL be written by the model, falling back to a deterministic question
only when the model fails or times out.

#### Scenario: Vague opening turn
- **WHEN** the user says "quiero un crédito" without an amount
- **THEN** the assistant asks how much they need (and what for) and no offer surface
  is rendered or persisted

#### Scenario: Amount but no purpose
- **WHEN** the user gives an amount but not a purpose
- **THEN** the assistant asks what they would use it for (once) before offering,
  unless it has already asked

#### Scenario: Provider failure during intake
- **WHEN** the model fails or times out while asking the intake question
- **THEN** a deterministic, natural clarifying question is returned instead, still
  with no terminal offer

### Requirement: The requested amount persists across turns
The system SHALL persist the requested amount (and purpose) in the loan
conversation and reuse it on later turns, so the offer and any created loan stay
at the amount the user asked for instead of defaulting to the engine maximum.

#### Scenario: Amount then term confirmation
- **WHEN** the user asks for an amount and, on a later turn, confirms a term without
  repeating the amount
- **THEN** the offer and the created loan use the originally requested amount, not
  the maximum

#### Scenario: Maximum is only offered when asked
- **WHEN** the user never gives an amount and never asks for the maximum
- **THEN** no maximum offer is ever produced

### Requirement: An explicit maximum request is honored
The system SHALL treat phrases such as "el máximo", "lo que me puedas dar" or
"tú dime" as a legitimate request for the engine's maximum offer.

#### Scenario: Asking for the maximum
- **WHEN** the user explicitly asks for the maximum amount
- **THEN** the terminal offer is built at the engine's maximum affordable amount
