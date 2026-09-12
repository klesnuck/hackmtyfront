## Purpose

The shared full-screen error state shown for unrecoverable failures, matching Figma node `37:351`, so the app has one consistent "something went wrong" experience instead of each screen inventing its own.

## ADDED Requirements

### Requirement: Error screen matches Figma
The system SHALL render, for an unrecoverable failure, a screen with: a back affordance, the Banorte wordmark, a red alert icon inside a soft circular badge, an "¡Oops!" heading, a short explanatory message, a monospace-style error-code tag, a primary "Volver al inicio" button, and a "¿Necesitas ayuda? Contáctanos" link.

#### Scenario: Unrecoverable failure
- **WHEN** a screen hits a failure it cannot reasonably recover from inline (e.g. the initial session bootstrap fails, or a critical data fetch a screen cannot render without fails after retry)
- **THEN** the error screen renders with a human-readable message and a specific error code, not a raw stack trace or blank screen

### Requirement: Error codes are specific, not generic
The system SHALL show a distinct error code per failure category (e.g. network unreachable, session expired, unexpected server error) rather than one catch-all code, so the "Contáctanos" path and any support triage has something concrete to go on.

#### Scenario: Different failures show different codes
- **WHEN** two different underlying failures (e.g. a timeout vs. a 500 response) trigger the error screen
- **THEN** they show different error codes

### Requirement: "Volver al inicio" always recovers to a working state
The system SHALL make "Volver al inicio" navigate to the Inicio tab (or the login screen if no session exists) and never leave the user stuck on the error screen with no way forward.

#### Scenario: Recovery navigation
- **WHEN** the user presses "Volver al inicio" from the error screen
- **THEN** they land on a screen that renders successfully (Inicio tab if a session exists, login otherwise)

### Requirement: Reserved for unrecoverable failures only
The system SHALL NOT use the full-screen error state for recoverable situations (a failed form submission, a single failed list-item action) — those show inline errors so the user doesn't lose their place.

#### Scenario: Form submission failure
- **WHEN** a manual loan/savings application form submission fails
- **THEN** the form shows an inline error and lets the user retry, rather than navigating to the full-screen error state
