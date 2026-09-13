## MODIFIED Requirements

### Requirement: User interaction dispatches through one action path
The system SHALL send every component-triggered action through a single dispatch function that reads the node's `action.event`, resolves its context bindings, and routes the request — with no catalog component calling the network directly. For every action name except one documented exception, the request is `POST /api/action` and the response's `a2ui` array is applied into the surface store. The exception is the `request_loan` action: the dispatch function SHALL NOT send it to `POST /api/action`; it SHALL instead route it to the loan-creation flow (confirmation, then real loan submission), since that action represents an irreversible financial action the general surface-mutation endpoint does not handle.

#### Scenario: Button press with bound context
- **WHEN** a user presses a component whose `action.event.context` includes a `{ path }` binding, and the action name is not `request_loan`
- **THEN** the bound value is resolved from the data model before the request is sent, and the request body matches `{ surface_id, name, source_component_id, context }`

#### Scenario: request_loan is never sent to the generic action endpoint
- **WHEN** a user presses a component whose `action.event.name` is `request_loan`
- **THEN** the dispatch function routes it to the loan-creation flow instead of calling `POST /api/action`, with its context (including the resolved amount) preserved
