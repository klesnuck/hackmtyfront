## Purpose

The Apartados tab: a list of the user's savings vehicles (flexible savings, term deposits, goal-based apartados) and a manual creation flow, so saving doesn't require an AI conversation to get started.

## ADDED Requirements

### Requirement: Savings list matches Figma
The system SHALL show one card per savings vehicle with: name, a green "growth this month" badge (amount + "este mes"), the current balance, a divider, annual yield percentage, and an "Aportar fondos" affordance — matching Figma node `37:266`.

#### Scenario: Multiple savings vehicles
- **WHEN** the user has more than one savings vehicle (e.g. flexible savings, a term deposit, a goal)
- **THEN** each renders as its own card, scrollable if they exceed the screen height

#### Scenario: No savings vehicles
- **WHEN** the user has none yet
- **THEN** the list shows an empty state inviting the user to create one, not an error or blank screen

### Requirement: "Aportar fondos" adds money to an existing vehicle
The system SHALL treat "Aportar fondos" as the entry point to a top-up action for that specific savings vehicle.

#### Scenario: Tapping Aportar fondos
- **WHEN** the user taps "Aportar fondos" on a savings card
- **THEN** the app begins the top-up flow for that vehicle's id

### Requirement: Manual savings/apartado creation
The system SHALL let a user create a new savings vehicle without going through the AI assistant, collecting at minimum: a name, an initial amount (optional), and a vehicle type (flexible/term/goal) if more than one type is supported.

#### Scenario: Creating manually
- **WHEN** the user completes the manual creation form and submits
- **THEN** a new savings vehicle is created and appears in the list

### Requirement: Relationship to assistant-created Saving Bags is explicit
The system SHALL display savings vehicles created via the AI assistant's Saving Bags flow (REQ-BAG-* in `SPECS.md`) in the same list as manually created ones, once the backend confirms they share a resource — or, if they are confirmed to be separate resources, clearly distinguish the two in the UI rather than silently mixing or hiding one.

#### Scenario: Backend confirms a shared resource
- **WHEN** the backend's savings-vehicle resource includes both assistant-created and manually created entries
- **THEN** both appear in one unified list, with no visual distinction required

#### Scenario: Backend confirms separate resources
- **WHEN** the backend keeps Saving Bags and general savings vehicles as separate resources
- **THEN** the list clearly labels which entries came from an assistant conversation
