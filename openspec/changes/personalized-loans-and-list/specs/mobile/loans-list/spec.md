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
