## MODIFIED Requirements

### Requirement: User interaction dispatches through one action path
The system SHALL send every component-triggered action through a single dispatch function that reads the node's `action.event`, resolves its context bindings, calls `POST /api/action`, and applies the response's `a2ui` array into the surface store — with no catalog component calling the network directly. Before dispatching, it SHALL claim the shared assistant turn lock; when another assistant turn is already in flight, the action SHALL NOT be dispatched. The exception is the `request_loan` action: the dispatch function SHALL NOT send it to `POST /api/action`; it SHALL instead route it to the loan-creation flow (confirmation, then real loan submission), and it SHALL NOT claim the server turn lock because it is handled client-side.

#### Scenario: Button press with bound context
- **WHEN** a user presses a component whose `action.event.context` includes a `{ path }` binding, and the action name is not `request_loan`
- **THEN** the bound value is resolved from the data model before the request is sent, and the request body matches `{ surface_id, name, source_component_id, context }`

#### Scenario: Component press while a turn is in flight
- **WHEN** a user presses a component with a server-bound action while another assistant turn is still pending
- **THEN** no `POST /api/action` is sent and the in-flight turn is left undisturbed

#### Scenario: Client-routed action does not take the lock
- **WHEN** a component's action is handled locally (`request_loan` opens the confirmation flow)
- **THEN** it does not claim the server turn lock and does not call the network

#### Scenario: request_loan is never sent to the generic action endpoint
- **WHEN** a user presses a component whose `action.event.name` is `request_loan`
- **THEN** the dispatch function routes it to the loan-creation flow instead of calling `POST /api/action`, with its context (including the resolved amount) preserved
