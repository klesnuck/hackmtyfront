## Purpose

The visual entry gate that mints a mocked demo session before the user reaches the rest of the app. Explicitly NOT an authentication system (`SPECS.md` §12 excludes real auth) — the login screen's fields are decorative.

## ADDED Requirements

### Requirement: Login screen visually matches the approved Figma design
The system SHALL render the login screen matching the Figma design at node `37:2` (fileKey `G8zaBTJpiBYqLWtdb3DQ6g`): Banorte brand gradient header, wordmark, tagline, a white card with username/password fields, a password visibility toggle, a "¿Olvidé mi contraseña?" link, a primary "Entrar de forma segura" button, and a biometric entry affordance.

#### Scenario: Visual fidelity
- **WHEN** the login screen renders
- **THEN** its layout, colors, and copy match the Figma reference (verified via a rendered screenshot comparison during implementation)

### Requirement: Login does not authenticate — it bootstraps a session
The system SHALL treat every login screen interaction (main button or biometric affordance) as a trigger for `POST /api/session`, never validating the entered username/password against anything.

#### Scenario: Any input succeeds
- **WHEN** a user presses "Entrar de forma segura" regardless of what (if anything) was typed into the fields
- **THEN** a session is created via `POST /api/session` and, on success, the app navigates past the login screen

### Requirement: Session persists across app restarts
The system SHALL persist the `session_id` returned by `POST /api/session` in secure on-device storage and restore it on next launch, routing directly past the login screen when a persisted session exists.

#### Scenario: Cold start with an existing session
- **WHEN** the app launches and a `session_id` was persisted from a previous run
- **THEN** the user is routed directly to the post-login experience without seeing the login screen

#### Scenario: Cold start with no session
- **WHEN** the app launches with no persisted `session_id`
- **THEN** the user sees the login screen
