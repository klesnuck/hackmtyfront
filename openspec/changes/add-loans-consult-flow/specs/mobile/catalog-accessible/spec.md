## ADDED Requirements

### Requirement: Loan-offer catalog extensions are functional in the accessible catalog
The system SHALL render `LoanOffer`, `Heading`, `Badge`, and `ProgressBar` correctly and functionally in `voz-color`, satisfying the same type-enforced parity as every other catalog component, even if `LoanOffer`'s accessible-specific visual treatment (contrast, type scale, touch targets) lags behind its `standard` implementation initially.

#### Scenario: LoanOffer is usable in accessible mode
- **WHEN** a user in accessible mode reaches a terminal loan offer
- **THEN** the offer's amount, terms, risk breakdown, and accept/decline actions are all present and interactive, even before accessible-specific styling is applied
