## ADDED Requirements

### Requirement: Accessible catalog is color and tone first
The accessible catalog SHALL render text with the color implied by its `tone`,
and its Card and Badge SHALL use strong, tone-colored fills/accents with larger
type and targets, so the interface reads as color- and emoji-led for users who
need it.

#### Scenario: Tone-colored text
- **WHEN** a Text in the accessible catalog carries a `tone` (positive, warning, danger)
- **THEN** it renders in the corresponding strong color

#### Scenario: Tone-colored card
- **WHEN** a Card in the accessible catalog carries a `tone`
- **THEN** it renders with a strong colored accent/fill rather than the neutral card style

### Requirement: Accessible catalog is selected for a simple audience
The system SHALL generate surfaces with the accessible catalog when the
deterministic audience is `simple`, in addition to when the user has an
accessibility profile.

#### Scenario: Simple audience without an accessibility profile
- **WHEN** a user is classified as `simple` (e.g. elderly or basic education) without an accessibility profile
- **THEN** generated surfaces use the accessible catalog
