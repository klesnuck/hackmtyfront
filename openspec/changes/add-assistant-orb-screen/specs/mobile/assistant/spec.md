## Purpose

The Soporte IA tab: an idle greeting state with an animated floating orb and two entry points, transitioning into the active conversation view where the agent's generated A2UI surfaces render inline — matching Figma node `37:123` for the idle state.

## ADDED Requirements

### Requirement: Idle screen greets the user with an animated orb
The system SHALL show, as the Soporte IA tab's default view, a centered animated floating orb, a greeting headline, a short descriptive message, and two entry buttons ("Escribir", "Hablar").

#### Scenario: Landing on the tab
- **WHEN** the user switches to the Soporte IA tab with no conversation in progress
- **THEN** they see the idle orb screen, not the chat/turn list

#### Scenario: Orb animates continuously
- **WHEN** the idle screen is visible
- **THEN** the orb plays a continuous, looping animation (not a static image) for as long as the screen is visible, and stops/unmounts cleanly when the user navigates away

### Requirement: Entry buttons transition into the active conversation
The system SHALL transition from the idle screen into the existing chat/turn-list view when either entry button is pressed: "Escribir" focuses the text input, "Hablar" immediately starts voice recording.

#### Scenario: Escribir
- **WHEN** the user presses "Escribir"
- **THEN** the screen transitions to the active conversation view with the text input focused and no recording started

#### Scenario: Hablar
- **WHEN** the user presses "Hablar"
- **THEN** the screen transitions to the active conversation view and voice recording starts immediately, without a second tap on the mic button

### Requirement: Returning to idle after a conversation ends
The system SHALL return to the idle orb screen when the user navigates away from and back to the Soporte IA tab after a conversation with no further pending turns, rather than permanently pinning the chat view once entered.

#### Scenario: Revisit after leaving
- **WHEN** the user leaves the Soporte IA tab mid-idle (no conversation started) and returns
- **THEN** they see the idle screen again

### Requirement: Active conversation renders agent-generated surfaces inline
The system SHALL continue to render each agent turn's generated A2UI surface inline in the conversation using the same `<A2UISurface />` renderer used elsewhere in the app (already built — this requirement documents it as part of this capability, not a change to it).

#### Scenario: Agent turn with a generated surface
- **WHEN** the agent responds with an `a2ui` array
- **THEN** it renders inline in the conversation via the shared A2UI renderer, identical to how it would render in the Kill Test viewer
