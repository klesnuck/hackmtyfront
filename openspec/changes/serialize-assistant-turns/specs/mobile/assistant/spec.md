## Purpose

The Soporte IA conversation processes exactly one server-bound turn at a time,
so the backend never receives overlapping requests for a single conversation.

## ADDED Requirements

### Requirement: The assistant accepts one in-flight turn at a time
The system SHALL NOT start a new recording or send a new message while a turn is in flight. It SHALL claim a synchronous lock before issuing any server-bound request (`/api/message`, `/api/loans/greeting`, `/api/loans/consult`, `/api/agent/greeting`, `/api/action`, `POST /api/loans`) and release it when the response is received, and it SHALL visibly disable the send and microphone affordances while the lock is held.

#### Scenario: A second send in the same gesture
- **WHEN** the user submits two sends before the first response arrives (double-tap, return key plus tap, etc.)
- **THEN** exactly one request is issued for that turn

#### Scenario: Recording while a turn is pending
- **WHEN** the user presses the mic while a previous turn is still in flight
- **THEN** recording does not start, and the mic control is visibly disabled until the response is received

#### Scenario: Sending while recording
- **WHEN** the user is recording (requesting permission, listening, or processing)
- **THEN** the send control is disabled and no message is submitted, even if a draft was already typed

#### Scenario: Next turn after the response
- **WHEN** the response of the previous turn is received
- **THEN** the send and microphone controls become enabled again and the next turn can be started

### Requirement: Recording and sending are mutually exclusive
The system SHALL disable the microphone for the entire lifetime of a turn in flight and SHALL disable the send control and text input for the entire recording lifecycle, so a message and a recording can never overlap.

#### Scenario: Input is blocked while recording
- **WHEN** the speech state is `requesting-permission`, `listening`, or `processing`
- **THEN** the text input is not editable and the send affordance is disabled

### Requirement: The turn lock is always released
The system SHALL release the turn lock on success, on a handled backend error, and on a network timeout, so a failed or slow turn never leaves the input permanently blocked.

#### Scenario: A turn fails
- **WHEN** a turn ends with a visible error (including a timeout)
- **THEN** the send and microphone controls are enabled again and a new turn can be started
