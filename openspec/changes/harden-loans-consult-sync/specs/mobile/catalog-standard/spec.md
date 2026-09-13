## Purpose

Extend the standard catalog so the loans terminal's financial-impact components render.

## ADDED Requirements

### Requirement: Standard catalog implements the loans financial-impact components
The standard catalog SHALL implement `ScenarioComparison`, `PlanTable`, `ForecastChart`, `LineChart`, and `BreakAlert`, reading each one's props (literal or JSON-Pointer binding) from the surface data model and never recomputing financial figures client-side.

#### Scenario: Scenario comparison
- **WHEN** a `ScenarioComparison` node carries `scenarios` (label, monthlyPayment, payoffMonths, totalInterest, interestSaved, monthsSaved) and an optional `highlightIndex`
- **THEN** each scenario is listed with its terms and the highlighted scenario is visually distinguished

#### Scenario: Plan table
- **WHEN** a `PlanTable` node carries `months` (month, totalBalance, payment, interest, cash) and an optional `breakMonth`
- **THEN** the rows render and the break month is highlighted, with a progressive preview for long plans

#### Scenario: Charts
- **WHEN** a `ForecastChart` carries `forecast` (and optional `actual`), or a `LineChart` carries `points`
- **THEN** the series render as a chart scaled from the bound values, with no client-side interpolation of new financials

#### Scenario: Break alert
- **WHEN** a `BreakAlert` node carries `month` and `shortfall` (with optional `reasons`/`assumptions`)
- **THEN** it renders as a prominent alert naming the break month and shortfall
