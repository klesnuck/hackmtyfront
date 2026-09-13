## ADDED Requirements

### Requirement: Liability page is created once then re-hydrated
The system SHALL return, for a specific user and liability, a personalized
informational A2UI page. On first access it SHALL generate and store a template;
on later accesses it SHALL fetch and hydrate that same template with fresh data.
The stored template SHALL carry `{{placeholders}}`/bindings rather than frozen
values, and the balance/payoff/risk SHALL be recomputed from the live record on
every hydration.

#### Scenario: First access
- **WHEN** the user opens a liability that has no stored page
- **THEN** the backend generates the page, persists it for `(user, liability)`, and returns it

#### Scenario: Later access
- **WHEN** the user opens the same liability again
- **THEN** the stored template is reused and hydrated with current values

### Requirement: Liability page is informational and payable
The page SHALL be read-only information (a `LiabilitySummary` plus payoff
distribution and risk/behavior insights) and SHALL include an `abonar` action so
the user can pay. The `abonar` action is client-routed to the app's native payment
flow (`POST /api/liabilities/{id}/payment`), and SHALL always be available even if
the generated payload omitted it.

#### Scenario: Abonar present
- **WHEN** the page renders
- **THEN** an "Abonar" control is available and opens the payment flow for this liability

#### Scenario: Abonar missing from the model output
- **WHEN** the generated payload has no `abonar` action
- **THEN** a deterministic Abonar control is added

### Requirement: Liability page performs no research and no TTS
Liabilities have no stated purpose: the system SHALL NOT perform an online
research call and SHALL NOT synthesize speech for a liability detail page.

#### Scenario: Liability page generated
- **WHEN** the liability page is generated
- **THEN** no research provider call is made and `audio_ref` is null
