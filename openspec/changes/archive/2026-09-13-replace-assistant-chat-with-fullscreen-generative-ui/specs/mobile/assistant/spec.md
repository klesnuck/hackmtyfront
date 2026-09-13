## Purpose

The Soporte IA tab's active state once the agent starts generating UI: the generated surface takes over the whole screen as a single current answer, and the "Luna" orb becomes a floating affordance for continuing the conversation instead of a scrolling chat log.

## ADDED Requirements

### Requirement: Generated surface replaces the full assistant panel
The system SHALL render the most recently generated A2UI surface as the entire content of the Soporte IA screen — replacing the idle header, greeting, mic button, and text input — instead of appending it to a chat/turn history.

#### Scenario: First surface generated
- **WHEN** the agent responds with an `a2ui` payload for the first time in a session
- **THEN** the idle header, greeting, mic button, and text input are replaced by the rendered surface, and no chat/turn history is displayed anywhere on screen

#### Scenario: Not a modal
- **WHEN** a surface is showing full-panel
- **THEN** there is no dimmed backdrop, no dismiss-outside-to-close gesture, and no overlay layer above the rest of the screen — the surface is the screen's own content, not a dialog on top of it

### Requirement: Full-panel surfaces animate in from the bottom
The system SHALL animate a full-panel surface's entrance with a slide-up transition that originates from the bottom edge of the screen and covers the previously visible content as it settles into place.

#### Scenario: Entrance animation
- **WHEN** a surface begins rendering full-panel
- **THEN** it slides in from below the visible screen area to its resting position, rather than appearing instantly or fading in place

### Requirement: A new generated surface replaces the previous one
The system SHALL unmount the currently displayed full-panel surface when the agent generates a new one, keeping only the newest surface mounted — never both at once, and never leaving the previous surface reachable by scrolling or navigation.

#### Scenario: Second surface generated
- **WHEN** the agent generates a new `a2ui` surface while a previous surface is already showing full-panel
- **THEN** the previous surface is removed and the new surface takes its place using the same slide-up-from-bottom entrance animation described for the first surface

### Requirement: Floating orb keeps the assistant reachable during a generated surface
The system SHALL show the "Luna" orb as a floating control pinned to the bottom-right corner of the screen whenever a full-panel surface is displayed, and interacting with it SHALL let the user start a new voice or text input without dismissing the current surface first.

#### Scenario: Orb repositions
- **WHEN** a full-panel surface is displayed
- **THEN** the orb appears as a small floating control in the bottom-right corner of the screen rather than in its idle, centered position

#### Scenario: Continuing the conversation
- **WHEN** the user interacts with the floating orb while a surface is shown full-panel
- **THEN** they can submit a new voice or text message, and the current full-panel surface remains visible until the agent's next response replaces it

### Requirement: Floating orb cycles suggested prompts
The system SHALL periodically show a short suggested-question near the floating orb, cycling through a rotating set of prompts (for example "¿Tienes otra duda?", "¿Quieres saber algo más?", "¿Te gustaría cambiar tu préstamo?"), animating each one in and out on a repeating interval while the orb is in its floating state.

#### Scenario: Idle floating state
- **WHEN** the floating orb has been visible for its configured interval with no new user interaction
- **THEN** a suggested-prompt bubble animates into view near the orb, then animates back out before the next prompt in the rotation appears
