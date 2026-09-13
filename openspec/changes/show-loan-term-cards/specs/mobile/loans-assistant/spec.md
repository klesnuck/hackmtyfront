## ADDED Requirements

### Requirement: The terminal offer compares loan payment terms
When a loans terminal presents comparison cards, the system SHALL render the
loan's engine-backed payment-term (plazo) options for the offered amount, each
card showing its term, monthly payment, and total interest, and SHALL visually
distinguish the recommended term. The cards SHALL NOT present debt-payoff
scenarios, placeholder values, or a term-less "1 meses / $0" default.

#### Scenario: Loan offer with a debt-free user
- **WHEN** a user without existing debts receives a terminal loan offer
- **THEN** the comparison cards show the offered loan's plazos (for example 6, 12,
  24, 36, 48 months) each with a positive monthly payment and total interest, and
  the engine-recommended term is highlighted

#### Scenario: Figures come from the backend
- **WHEN** the terminal offer surface renders its plazo cards
- **THEN** every monthly payment and total interest value comes from the backend's
  engine-backed options, never recomputed or defaulted client-side

#### Scenario: Simple audience
- **WHEN** the user's audience level is `simple`
- **THEN** the plazo cards are still shown, in plain language (term + monthly
  payment + total interest), without CAT/DTI/charts/risk panels

### Requirement: The recommended term is personalized, never fixed
The system SHALL derive the recommended plazo from the applicant's profile,
payment likelihood and financial behavior (income and expense volatility,
liquidity buffer, payment history, subscription load, quincena pressure, savings
goals) and the requested amount, by trading total interest against the monthly
burden. It SHALL NOT mark a fixed term (for example, always 24 months). The
recommended plazo SHALL also be the term the offer itself is presented at.

#### Scenario: Different profiles, different recommendations
- **WHEN** a stable, high-surplus, on-time applicant and a volatile, thin-liquidity,
  weak-history applicant each receive a loan offer
- **THEN** their highlighted plazos differ (the riskier profile is steered toward a
  longer plazo than the stronger one)

#### Scenario: Requested amount matters
- **WHEN** the same applicant requests a smaller amount versus the maximum
- **THEN** the recommended plazo does not lengthen for the smaller amount

#### Scenario: The offer headline agrees with the highlighted card
- **WHEN** the terminal offer is rendered
- **THEN** `LoanOffer`'s term, monthly payment, total interest, CAT and schedule are
  the engine's values for the recommended plazo, and the recommended card carries a
  short reason for the choice
