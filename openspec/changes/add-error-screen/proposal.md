## Why

The app has no general-purpose error screen. Today, a failed request either shows an inline error message (e.g. the assistant chat's system-turn text) or, for anything outside a screen that handles its own errors, nothing at all. Figma defines a dedicated full-screen error state (node `37:351`, fileKey `G8zaBTJpiBYqLWtdb3DQ6g`) for unrecoverable failures — worth having as a shared component before more screens (loans, savings, transfers) are built and each invents its own error handling.

## What Changes

- Adds a reusable `ErrorScreen` matching Figma: back affordance, Banorte wordmark, an alert icon badge, "¡Oops!" heading, message, an error code tag, a primary "Volver al inicio" button, and a "¿Necesitas ayuda? Contáctanos" link.
- Adds a convention for when to show it: unrecoverable failures (e.g. a critical fetch failing with no reasonable inline fallback), not routine/recoverable errors (a failed form submission should show inline validation, not a full-screen takeover).

## Capabilities

### New Capabilities
- `mobile/error-screen`: the shared full-screen error state and the convention for when the rest of the app should use it.

## Impact

- New shared component, likely `src/catalog/shared/ErrorScreen.tsx` or a dedicated route depending on how it's invoked (see `design.md`).
- No backend dependency — this is purely client-side UI plus an error-code display convention.
