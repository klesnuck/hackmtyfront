## ADDED Requirements

### Requirement: Loan page is created once then re-hydrated
The system SHALL return, for a specific user and loan, a personalized A2UI page.
On first access it SHALL generate and store a template; on later accesses it SHALL
fetch and hydrate that same template with fresh data. The stored template SHALL
carry `{{placeholders}}`/bindings rather than frozen financial values, and the
loan's amounts, term and schedule SHALL be re-derived from the live record on
every hydration.

#### Scenario: First access
- **WHEN** the user opens a loan that has no stored page
- **THEN** the backend generates the page, persists it for `(user, loan)`, and returns it

#### Scenario: Later access
- **WHEN** the user opens the same loan again
- **THEN** the stored template is reused and hydrated with current values, with no regeneration

#### Scenario: Data is not stale
- **WHEN** the loan's record changes between visits
- **THEN** the reopened page reflects the current values, not the snapshot stored at generation time

### Requirement: Purpose is collected during intake with a private option
The system SHALL ask for the credit's purpose during the loans intake and SHALL
let the user answer that it is private, in which case it SHALL stop asking and
record the reason as private.

#### Scenario: User states a purpose
- **WHEN** the user answers why they want the credit
- **THEN** the purpose is stored in the loan conversation state and persisted on the created loan

#### Scenario: User chooses private
- **WHEN** the user indicates the reason is private
- **THEN** the system stops asking and marks the loan's purpose as private

### Requirement: Purpose grounds the page in research unless private
When a non-private purpose is known, the system SHALL research the topic and
present the findings in financial terms on the page. When the purpose is private,
the system SHALL NOT perform any online research and SHALL personalize the page
from the user's own data instead.

#### Scenario: Non-private purpose
- **WHEN** the page is generated with a stated, non-private purpose
- **THEN** the page includes a topical cost breakdown derived from the research provider

#### Scenario: Private purpose
- **WHEN** the page is generated for a private reason
- **THEN** no research provider call is made, and the page is still fully personalized

### Requirement: Loan page complexity follows the audience
The system SHALL personalize the loan page from the deterministic audience. Users
who are elderly, low-literacy or have an accessibility profile SHALL receive a
color- and emoji-first interface; otherwise the interface density SHALL follow the
user's real financial activity.

#### Scenario: Simple audience
- **WHEN** the audience level is `simple`
- **THEN** the page uses the accessible catalog with emoji and color

#### Scenario: Higher activity
- **WHEN** the user has a higher audience/activity level
- **THEN** the page may include denser, more technical sections (e.g. CAT, schedule, charts)

### Requirement: The loan detail page is informational, never an offer
Because the loan is already granted and active, the page SHALL NOT present offer
or acceptance semantics: it SHALL NOT contain a `LoanOffer` component or a
`request_loan` action, and this SHALL be enforced deterministically (not only by
prompt), so a taken credit is never shown as available to accept again.

#### Scenario: Model emits offer semantics
- **WHEN** the generated payload contains a `LoanOffer` or a `request_loan` action
- **THEN** it is stripped before persistence, and the page still renders (read-only)

### Requirement: The page shows the loan's real information
The page SHALL show a read-only `LoanSummary` (read-only; no action) and, adapted
to the audience, how the payment splits between principal and interest over time,
and the user's current risk/behavior insights computed from their own data.

#### Scenario: Distribution view
- **WHEN** the page is generated
- **THEN** it includes a payment-distribution view (a table and/or chart depending on the profile)

#### Scenario: Risk from current behavior
- **WHEN** the page is generated
- **THEN** its risk/insights come from a fresh deterministic recomputation for this loan, not a stored snapshot

### Requirement: Structure follows the user profile
The page structure SHALL be selected deterministically from the audience: `simple`
users get an emoji/color, chart-free layout; `standard` users get one distribution
view; `detailed` users get both a chart and a table plus the full risk metrics.

#### Scenario: Simple audience
- **WHEN** the audience is `simple`
- **THEN** the page avoids tables/charts and uses large emoji-led summaries

### Requirement: No text-to-speech on detail pages
The loan detail page SHALL NOT synthesize or play speech.

#### Scenario: Accessible user opens the page
- **WHEN** an accessible/simple user opens the loan detail page
- **THEN** no audio is generated and `audio_ref` is null
