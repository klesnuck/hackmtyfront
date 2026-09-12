# mobile/a2ui-engine Specification

## Purpose

The client-side runtime that turns a backend-generated A2UI v0.9.1 message array into a rendered, interactive React Native surface, and turns user interaction back into a request to the agent. This is the core mechanism that makes the app's UI agent-generated rather than a fixed set of screens (INV-016, INV-017).

## Requirements

### Requirement: A2UI message types match the real v0.9.1 protocol
The system SHALL represent A2UI messages (`createSurface`, `updateComponents`, `updateDataModel`, `deleteSurface`) and the client action message with types transcribed from the official A2UI v0.9.1 specification (a2ui.org), not invented.

#### Scenario: Envelope shape
- **WHEN** a backend response includes an `a2ui` array
- **THEN** each entry is one of `createSurface`, `updateComponents`, `updateDataModel`, or `deleteSurface`, keyed exactly as the protocol defines

### Requirement: Surface state is a normalized, patchable graph
The system SHALL maintain each surface as a flat `components` map keyed by component id plus a separate `dataModel`, applying incoming messages by upserting components (`updateComponents`) and patching the data model by JSON Pointer (`updateDataModel`), rather than replacing the whole surface on every message.

#### Scenario: Incremental update
- **WHEN** the backend sends an `updateComponents` message containing only some component ids for an existing surface
- **THEN** those components are upserted into the existing surface's component map and every other existing component is left untouched

#### Scenario: Data model patch
- **WHEN** the backend sends `updateDataModel` with a `path` and a `value`
- **THEN** the value at that JSON Pointer path in the surface's data model is set, and omitting `value` deletes the key at that path

### Requirement: Data bindings resolve against the data model and template scope
The system SHALL resolve `DynamicString`/`DynamicNumber`/`DynamicBoolean` props (`{ path }` or `{ call, args }`) against the surface's data model, resolving relative paths against the current template scope when rendering inside a bound list.

#### Scenario: Absolute path binding
- **WHEN** a component prop is `{ path: "/user/name" }`
- **THEN** it resolves against the surface's data model root regardless of template scope

#### Scenario: Relative path inside a template list
- **WHEN** a `children: { object: { path, componentId } }` list is rendered and a descendant prop uses a relative (non-`/`-prefixed) path
- **THEN** it resolves against the current list item, not the data model root

### Requirement: Unknown component types and ids never crash the app
The system SHALL render a dev-only visible fallback for an unrecognized `component` type or a referenced id that was never sent, and render nothing (silently) in production, rather than throwing.

#### Scenario: Unrecognized component type in development
- **WHEN** a node's `component` value has no matching entry in the active catalog registry and the app is running in development
- **THEN** a visible "unrecognized component" indicator renders in place of that node, and the rest of the surface renders normally

#### Scenario: Unrecognized component type in production
- **WHEN** the same situation occurs in a production build
- **THEN** nothing crashes and the unrecognized node renders as empty space

### Requirement: User interaction dispatches through one action path
The system SHALL send every component-triggered action through a single dispatch function that reads the node's `action.event`, resolves its context bindings, calls `POST /api/action`, and applies the response's `a2ui` array into the surface store — with no catalog component calling the network directly.

#### Scenario: Button press with bound context
- **WHEN** a user presses a component whose `action.event.context` includes a `{ path }` binding
- **THEN** the bound value is resolved from the data model before the request is sent, and the request body matches `{ surface_id, name, source_component_id, context }`

### Requirement: Catalog selection is driven by accessibility state, not the wire protocol
The system SHALL choose which local catalog (`standard` or `voz-color`) renders a surface based on the session's accessibility profile, independent of the surface's own wire-level `catalogId` (a protocol/schema identifier from `createSurface`).

#### Scenario: Non-flagged session
- **WHEN** the current session has no accessibility flags
- **THEN** surfaces render with the `standard` catalog

#### Scenario: Flagged session
- **WHEN** the current session's accessibility profile has any flag set (elderly, blind, low_literacy, other)
- **THEN** surfaces render with the `voz-color` catalog
