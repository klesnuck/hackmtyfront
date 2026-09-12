# mobile/catalog-accessible Specification

## Purpose

The high-contrast, larger-scale catalog that automatically renders A2UI surfaces for accessibility-flagged accounts (elderly, blind, low-literacy, other — equivalent to REQ-ACC-02), without a manual opt-in toggle anywhere in the app.

## Requirements

### Requirement: Type-enforced parity with the standard catalog
The system SHALL implement the same closed set of A2UI basic catalog component types in `voz-color` as in `standard`, enforced by a shared TypeScript type so a missing component type fails the build rather than surfacing only during a live accessible-mode demo.

#### Scenario: Compile-time parity check
- **WHEN** a component type exists in the `standard` catalog registry
- **THEN** the `voz-color` catalog registry is required by its type to also provide that key, or the project fails to type-check

### Requirement: Text and primary actions scale up for accessibility
The system SHALL render text at a larger type scale and primary buttons with a larger minimum touch target and higher-contrast styling in the `voz-color` catalog than in `standard`.

#### Scenario: Larger text
- **WHEN** a Text node renders in the `voz-color` catalog
- **THEN** it uses the accessible type scale, which is larger than the standard scale for every variant

#### Scenario: Larger touch target
- **WHEN** a Button node renders in the `voz-color` catalog
- **THEN** its minimum height is at least 56px, above the standard catalog's 50px

### Requirement: Remaining input components are functional, visual parity pending
The system SHALL render TextField, CheckBox, ChoicePicker, Slider, and DateTimeInput correctly and functionally in `voz-color` even while they currently reuse the `standard` catalog's visual implementation (no accessible-specific styling yet).

#### Scenario: Functional but not yet visually distinct
- **WHEN** a user in accessible mode interacts with a ChoicePicker
- **THEN** selection and action dispatch work correctly, even though its appearance currently matches the standard catalog rather than an accessible-specific treatment
