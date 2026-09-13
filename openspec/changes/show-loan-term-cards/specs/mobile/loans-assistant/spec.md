## ADDED Requirements

### Requirement: The terminal offer compares loan payment terms
When a loans terminal presents comparison cards, the system SHALL render the
loan's engine-backed payment-term (plazo) options for the offered amount, each
card showing its term, monthly payment, and total interest, and SHALL visually
distinguish the selected term. The cards SHALL NOT present debt-payoff scenarios,
placeholder values, or a term-less "1 meses / $0" default.

#### Scenario: Loan offer with a debt-free user
- **WHEN** a user without existing debts receives a terminal loan offer
- **THEN** the comparison cards show the offered loan's plazos each with a
  positive monthly payment and total interest, and the selected term is highlighted

#### Scenario: Figures come from the backend
- **WHEN** the terminal offer surface renders its plazo cards
- **THEN** every monthly payment and total interest value comes from the backend's
  engine-backed options, never recomputed or defaulted client-side

#### Scenario: Simple audience
- **WHEN** the user's audience level is `simple`
- **THEN** the plazo cards are still shown, in plain language (term + monthly
  payment + total interest), without CAT/DTI/charts/risk panels

### Requirement: The offered plazos fit the amount
The system SHALL limit the candidate plazos to those that make sense for the
offered amount (amount-banded), so a small loan does not offer long terms, while
always including the selected term and any term the user explicitly asked for.

#### Scenario: Small amount
- **WHEN** the offered amount is small (for example under 15,000)
- **THEN** the plazo options are short (for example 6 and 12 months), not 36/48

#### Scenario: Large amount
- **WHEN** the offered amount is large (for example 100,000 or more)
- **THEN** longer plazos (for example 12/24/36/48) are available

### Requirement: The recommended term is personalized, never fixed
The system SHALL derive the recommended plazo from the applicant's profile,
payment likelihood and financial behavior (income and expense volatility,
liquidity buffer, payment history, subscription load, quincena pressure, savings
goals) and the requested amount, by trading total interest against the monthly
burden. It SHALL NOT mark a fixed term (for example, always 24 months). The
selected plazo SHALL be the term the offer itself is presented at.

#### Scenario: Different profiles, different recommendations
- **WHEN** a stable, high-surplus, on-time applicant and a volatile, thin-liquidity,
  weak-history applicant each receive a loan offer
- **THEN** their selected plazos differ (the riskier profile is steered toward a
  longer plazo than the stronger one)

#### Scenario: The offer headline agrees with the highlighted card
- **WHEN** the terminal offer is rendered
- **THEN** `LoanOffer`'s term, monthly payment, total interest, CAT and schedule are
  the engine's values for the selected plazo, and the selected card carries a short
  reason for the choice

### Requirement: A user-specified term is confirmed before it is offered
When the user states a specific term, the system SHALL NOT ignore it and SHALL NOT
silently offer a different term. Until the user explicitly confirms, the system
SHALL return a confirmation turn (no terminal offer) that acknowledges the
requested term and explains the real implications from the engine — the monthly
payment, its share of income, the total interest, and a comparison to the
recommended term — and, if the requested term is unaffordable, that the payment
exceeds the user's capacity along with alternatives. Only after confirmation does
the terminal offer appear at the requested term. The requested/confirmed term
SHALL persist across turns so the conversation stays consistent.

#### Scenario: Insisting on a term
- **WHEN** the user says they want the loan over a specific number of months
- **THEN** the assistant asks the user to confirm, stating the monthly payment,
  total interest and how it compares to the recommended term, and no offer is
  created yet

#### Scenario: Confirmation
- **WHEN** the user confirms the requested term
- **THEN** the terminal offer is built at that term and acceptance creates the loan
  at that term

#### Scenario: Consistency across turns
- **WHEN** a later turn does not restate the term
- **THEN** the assistant keeps using the term already requested/confirmed in the
  conversation, and does not silently revert to its own recommendation

#### Scenario: Unaffordable requested term
- **WHEN** the requested term's payment exceeds the user's affordable capacity
- **THEN** the assistant says so, does not proceed as if it were fine, and offers
  the recommended term or a lower amount
