## ADDED Requirements

### Requirement: Loan-offer catalog extensions render alongside the basic catalog
The system SHALL implement, in addition to the 18 A2UI basic catalog types, the product-specific `LoanOffer`, `Heading`, `Badge`, and `ProgressBar` component types in the `standard` catalog registry, with real styled React Native implementations.

#### Scenario: LoanOffer renders full offer detail
- **WHEN** a surface contains a `LoanOffer` component
- **THEN** the `standard` catalog renders its amount, rate, term, monthly payment, total cost, amortization schedule, risk breakdown, and warnings, plus its accept/decline actions

#### Scenario: Supporting components render
- **WHEN** a surface contains a `Heading`, `Badge`, or `ProgressBar` component
- **THEN** the `standard` catalog renders each with a real, styled implementation, not a placeholder
