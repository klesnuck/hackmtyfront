## Purpose

Keep the accessible catalog's closed vocabulary in parity with the standard catalog.

## ADDED Requirements

### Requirement: Accessible catalog implements the loans financial-impact components
The accessible catalog (`voz-color`) SHALL provide `ScenarioComparison`, `PlanTable`, `ForecastChart`, `LineChart`, and `BreakAlert`, matching the standard catalog's node-type vocabulary (functional parity; accessible-specific styling may be added later).

#### Scenario: Accessible user receives a terminal with these components
- **WHEN** an accessible user's loans terminal includes any of these component types
- **THEN** the accessible catalog renders it (no missing-component fallback)
