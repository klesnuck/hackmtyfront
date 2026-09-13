## ADDED Requirements

### Requirement: Backend origin is normalized before use
The system SHALL construct the backend origin in exactly one place and SHALL
remove all trailing slashes, so concatenating a leading-slash API path can never
produce `//` (which the edge answers with 404 and the backend never logs).

#### Scenario: Configured origin has a trailing slash
- **WHEN** the configured backend origin ends in one or more `/`
- **THEN** requests are sent to `origin + /api/...` with no doubled slash

#### Scenario: Configured origin has no trailing slash
- **WHEN** the configured backend origin has no trailing slash
- **THEN** requests are sent unchanged (single slash)
