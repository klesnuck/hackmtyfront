## MODIFIED Requirements

### Requirement: Idle screen greets the user with an animated orb
The system SHALL show, as the Soporte IA tab's default view, a centered animated floating orb, a greeting headline, a short descriptive message, and two entry buttons ("Escribir", "Hablar"). While the user is actively speaking to the assistant (recording), the orb SHALL additionally react visibly to the amplitude of the user's voice, distinct from its idle breathing/rotation animation.

#### Scenario: Landing on the tab
- **WHEN** the user switches to the Soporte IA tab with no conversation in progress
- **THEN** they see the idle orb screen, not the chat/turn list

#### Scenario: Orb animates continuously
- **WHEN** the idle screen is visible
- **THEN** the orb plays a continuous, looping animation (not a static image) for as long as the screen is visible, and stops/unmounts cleanly when the user navigates away

#### Scenario: Orb reacts to the user's voice while listening
- **WHEN** the user is recording a voice message ("Hablar" active, `isListening` true) and speaks
- **THEN** the orb visibly deforms/brightens in response to the rising and falling volume of the user's voice, distinct from its baseline idle motion

#### Scenario: Orb returns to idle motion when listening stops
- **WHEN** voice recording ends
- **THEN** the orb's voice-reactive deformation settles back to its baseline idle breathing/rotation, without an abrupt jump
