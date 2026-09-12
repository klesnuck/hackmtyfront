# mobile/catalog-standard Specification

## Purpose

The default set of visual components the A2UI engine renders backend-generated surfaces with — a from-scratch React Native implementation of the A2UI "basic" catalog vocabulary, with no third-party UI component library (INV-016).

## Requirements

### Requirement: Full basic catalog coverage
The system SHALL implement all 18 component types from the A2UI "basic" reference catalog (Text, Image, Icon, Video, AudioPlayer, Row, Column, List, Card, Tabs, Modal, Divider, Button, TextField, CheckBox, ChoicePicker, Slider, DateTimeInput) in the `standard` catalog registry.

#### Scenario: Every basic type renders
- **WHEN** a surface contains a component whose `component` value is one of the 18 basic catalog types
- **THEN** the `standard` catalog renders it with a real, styled React Native implementation, not a placeholder

### Requirement: Nested-reference components resolve via the shared renderer
The system SHALL let components whose children live inside a custom prop rather than `children`/`child` (Tabs' `tabs[].child`, Modal's `trigger`/`content`) render those referenced components through the same surface context (data model, catalog, component map) as the top-level renderer.

#### Scenario: Tabs renders its active tab's child
- **WHEN** a `Tabs` component's `tabs` array references component ids via `child`
- **THEN** switching tabs renders the newly selected tab's referenced component with correct data bindings

### Requirement: Interactive components dispatch on the appropriate trigger
The system SHALL dispatch a bound `action.event` at a trigger appropriate to the component: immediately on toggle/selection for Button, CheckBox, ChoicePicker, and Slider (on gesture end); on blur (not per keystroke) for TextField; on selection for DateTimeInput.

#### Scenario: TextField does not dispatch per keystroke
- **WHEN** a user types into a TextField bound to an `action.event`
- **THEN** no request is sent until the field loses focus and its value has changed

### Requirement: Motion is centralized, not ad hoc
The system SHALL implement press feedback, entrance transitions, and gesture-driven components (Slider) using `react-native-reanimated` v4 and shared spring/timing presets from one theme module, rather than per-component animation configuration.

#### Scenario: Consistent press feedback
- **WHEN** any interactive standard-catalog component (Button, ChoicePicker chip, CheckBox) is pressed
- **THEN** it applies the same scale-spring press feedback as every other interactive component
