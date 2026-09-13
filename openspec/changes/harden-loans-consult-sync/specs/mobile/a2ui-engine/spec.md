## Purpose

Tighten the A2UI payload contract observed from the backend's loans consult.

## ADDED Requirements

### Requirement: Action props are Action objects
The system SHALL expect a component `action` to be an `Action` object (`{"event": {"name": ..., "context": ...}}`), never a bare action-name string. A bare string SHALL be treated as an invalid payload and surfaced in development.

#### Scenario: Interactive offer
- **WHEN** a `LoanOffer` or `Button` carries an `action.event.name`
- **THEN** the single dispatch path resolves its context and routes it (with `request_loan` client-routed to the confirmation flow)

### Requirement: Typed props are literals or bindings
The system SHALL expect numeric/boolean props to be a literal of that type or a `{"path": ...}` binding; whole `{{dot.path}}` placeholder strings on typed props are not part of the client contract.

#### Scenario: Numeric offer fields
- **WHEN** a `LoanOffer` carries `amount`, `apr`, `monthlyPayment`, etc.
- **THEN** each value is a number (or resolved binding) and is rendered as-is, without parsing placeholders client-side
