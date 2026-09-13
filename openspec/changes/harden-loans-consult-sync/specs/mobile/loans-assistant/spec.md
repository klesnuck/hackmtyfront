## Purpose

Hardening the AI-driven loan conversation: consult failures are visible, a turn
answers within a ~5 s budget, conversation identity is correct across turns, and
every component a loans terminal can carry has a real implementation.

## ADDED Requirements

### Requirement: Consult failures are always visible
The system SHALL render a loans consult that returns `status:"error"` as a user-visible Spanish message, mapping the backend `error_code` when known and falling back to the backend `message`, and SHALL offer a retry affordance when `retryable` is true. It SHALL NOT leave a failed consult without feedback.

#### Scenario: Backend returns a handled error
- **WHEN** a consult response has `status:"error"` with an `error_code`
- **THEN** the conversation shows the corresponding Spanish message as an assistant/system turn and, when `retryable` is true, an affordance to retry the turn

#### Scenario: Unexpected exception while consulting
- **WHEN** the consult request throws (network, timeout, parse)
- **THEN** the conversation shows a handled Spanish failure message instead of freezing or remaining silent

### Requirement: A consult turn answers within five seconds
The system SHALL bound a consult turn so the user receives a response within approximately five seconds. The client SHALL abort a consult that exceeds its timeout and show a handled timeout message; the backend is responsible for returning either the model's interface or a deterministic engine-built interface within the budget.

#### Scenario: Model is slow
- **WHEN** the backend cannot produce a model interface within its deadline
- **THEN** the consult still returns an interface (or a not-eligible explanation) within the budget, and the client renders it without waiting past its own timeout

#### Scenario: Client timeout
- **WHEN** the consult request has not resolved before the client's abort threshold
- **THEN** the turn ends with a visible Spanish timeout message and the conversation remains usable

### Requirement: Conversation identity is correct from the first turn
The system SHALL use the loan session identifier returned by the greeting for every subsequent consult turn, including when the greeting and the first consult are issued in the same user action.

#### Scenario: Greeting then consult in one action
- **WHEN** a user's first action both starts the conversation and sends a message
- **THEN** the consult uses the session created by the greeting, without a "no session" failure

### Requirement: A not-eligible consult renders no offer
The system SHALL treat a consult with no terminal offer as an ordinary conversational turn: it shows the assistant's `response_text` and renders no offer surface and no accept affordance.

#### Scenario: User cannot be offered any amount
- **WHEN** the consult returns `terminal_response: null` with explanatory text
- **THEN** the text is shown and the conversation stays open, with no offer to accept

### Requirement: The loans terminal uses only implemented components
The system SHALL render every component a loans terminal can carry. The mobile catalogs SHALL implement `ScenarioComparison`, `PlanTable`, `ForecastChart`, `LineChart`, and `BreakAlert` in addition to the existing set, and SHALL treat an unrecognized component type as a development-visible contract violation.

#### Scenario: Terminal with financial-impact components
- **WHEN** a terminal surface includes `ScenarioComparison`, `PlanTable`, `ForecastChart`, `LineChart`, or `BreakAlert`
- **THEN** each renders from the backend's data without client-side recomputation
