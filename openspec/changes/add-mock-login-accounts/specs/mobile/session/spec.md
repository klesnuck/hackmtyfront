## MODIFIED Requirements

### Requirement: Login does not authenticate — it bootstraps a session
The system SHALL treat every login screen interaction (main button or biometric affordance) as a trigger for bootstrapping a session, never validating the entered username/password as real credentials.

While `POST /api/session` (REQ-API-01) is not yet available from the backend, the system SHALL resolve the session by matching the entered username/password against a fixed, client-side list of mock accounts (`src/features/session/mockAccounts.ts`) instead of calling the endpoint. Each mock account SHALL map to a `SessionResponse` shape (a generated `session_id` plus, where applicable, an `accessibility_profile`) so downstream behavior (REQ-ACC-01/02, session persistence) is identical to what the real endpoint would produce. This is a temporary fallback, not an authentication system: unmatched input SHALL simply keep the user on the login screen, with no account enumeration, error detail, or security posture implied.

This fallback SHALL be removed and every call site SHALL switch back to `POST /api/session` as soon as the backend confirms the endpoint is available (tracked by this change's `tasks.md`).

#### Scenario: Any input succeeds
- **WHEN** a user presses "Entrar de forma segura" regardless of what (if anything) was typed into the fields, and `POST /api/session` is available
- **THEN** a session is created via `POST /api/session` and, on success, the app navigates past the login screen

#### Scenario: Mock account match (endpoint unavailable)
- **WHEN** a user presses "Entrar de forma segura" with a username/password pair that matches one of the mock accounts
- **THEN** a local `SessionResponse` is minted for that account (matching its `accessibility_profile`, if any) and the app navigates past the login screen exactly as it would after a real `POST /api/session` call

#### Scenario: No mock account match (endpoint unavailable)
- **WHEN** a user presses "Entrar de forma segura" with input that matches no mock account
- **THEN** no session is created and the user remains on the login screen

#### Scenario: Real endpoint restored
- **WHEN** the backend's `POST /api/session` becomes available
- **THEN** the login screen SHALL call the real endpoint again for every interaction and the mock account list SHALL no longer be consulted or shipped
