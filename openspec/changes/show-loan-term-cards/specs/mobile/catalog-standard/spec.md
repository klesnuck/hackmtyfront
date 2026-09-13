## ADDED Requirements

### Requirement: Scenario-comparison term cards are labeled by term
When a `ScenarioComparison` scenario's `label` is a payment term (for example
"12 meses"), the system SHALL use it as the card title and SHALL NOT also render
the generic "Plazo" metric row, so the term is not repeated. When the scenario is
the highlighted one, the system SHALL mark it as the recommended term and SHALL
render its optional `note` (a short backend-provided reason) when present. Debt
scenarios (labels such as "Pago mínimo" or "Abono extra $500/mes") keep the
"Plazo" row.

#### Scenario: Term card
- **WHEN** a scenario label matches a term like "24 meses"
- **THEN** the card shows the label, the monthly payment, and the total interest,
  with no separate "Plazo" row

#### Scenario: Recommended term
- **WHEN** the highlighted scenario is a term card
- **THEN** it is marked as recommended and, if it carries a `note`, that reason is
  shown on the card

#### Scenario: Debt scenario unaffected
- **WHEN** a scenario label is not a term (for example "Pago mínimo")
- **THEN** the card still shows the "Plazo" (payoff months) row
