## ADDED Requirements

### Requirement: Préstamos lists created loans and active liabilities
The system SHALL show the user's created loans and their active liabilities in a
single list, each row identifying its source, and SHALL show an empty state only
when there are no created loans and no active liabilities.

#### Scenario: A created loan appears
- **WHEN** the user creates a credit (through the assistant or the application form)
- **THEN** it appears in the Préstamos list on the next fetch, alongside any active liabilities

#### Scenario: No credits at all
- **WHEN** the user has no created loans and no active liabilities
- **THEN** the list shows the empty state with the application entry point

### Requirement: The application form creates a real loan
The system SHALL submit the in-app "Solicitar préstamo" form to the real create
endpoint and refresh the list on success, instead of simulating an outcome.

#### Scenario: Successful application
- **WHEN** the user submits a valid amount, term and purpose
- **THEN** the backend creates and disburses the loan, the form reports success, and the list is refreshed

### Requirement: A loan row opens its detail page
The system SHALL navigate to the loan's personalized detail page when the user
taps a row whose source is a created loan; liability rows keep their "Abonar" flow.

#### Scenario: Tapping a loan
- **WHEN** the user taps a row with source `loan`
- **THEN** the loan detail screen opens for that loan id

### Requirement: Confirming an application opens the new loan's page
When the user confirms an in-assistant loan and it is created, the system SHALL
navigate to that loan's personalized detail page and SHALL reset the assistant's
consult/panel state so returning to the assistant shows the idle greeting rather
than the stale terminal surface.

#### Scenario: Loan created from the assistant
- **WHEN** the user confirms the loan and the backend returns the created loan
- **THEN** the app navigates to the loan's detail page and clears the consult state
