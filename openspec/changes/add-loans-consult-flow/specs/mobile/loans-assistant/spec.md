## Purpose

The AI-driven loan conversation: detecting that a user wants a loan, running the backend's greeting/consult intake loop, rendering the resulting personalized offer and its financial-impact breakdown, and turning an explicit accept into a real, disbursed loan.

## ADDED Requirements

### Requirement: Loan intent routes a conversation to the loans consult loop
The system SHALL detect, from a conversation's opening user turn (typed or transcribed) or from an explicit prior selection, that the user wants to request a loan, and for the remainder of that conversation send turns to the loans consult loop instead of the general assistant message loop. When intent is ambiguous, the system SHALL default to the general assistant message loop rather than guessing wrong into a financial flow.

#### Scenario: Explicit quick-action entry
- **WHEN** the user reaches the assistant from a "Solicitar un préstamo" quick action
- **THEN** the conversation starts the loans greeting immediately, with no keyword detection needed

#### Scenario: Free-form entry recognized as a loan request
- **WHEN** a user's first message in a fresh conversation is text like "quiero un crédito de 50000" or "necesito un préstamo"
- **THEN** the conversation switches to the loans consult loop for that message and every subsequent turn in the conversation

#### Scenario: Ambiguous entry stays on the general assistant
- **WHEN** a user's first message does not clearly indicate a loan request
- **THEN** the conversation proceeds through the existing general assistant message loop, unchanged from current behavior

### Requirement: Loan intake loop continues until a decision or a terminal offer
The system SHALL keep sending the user's replies to the loans consult loop, and displaying the assistant's follow-up questions, for as long as the backend reports no terminal offer, using the same conversation identifier across all turns of one loan request.

#### Scenario: Backend asks a follow-up question
- **WHEN** the loans consult response carries no terminal offer
- **THEN** the assistant's question is shown and the conversation stays open for the user's next reply, tied to the same loan request

#### Scenario: User is not eligible for any amount
- **WHEN** the backend determines the user cannot be offered any amount
- **THEN** the assistant's explanatory response is shown as ordinary conversation text, and no offer surface is rendered

### Requirement: Terminal offer shows amount, terms, and personalized financial impact
The system SHALL render the backend's terminal offer surface exactly as received, including the offered amount, its terms (rate, months, monthly payment, total cost), and the accompanying financial-impact breakdown (affordability relative to income and debt, liquidity buffer, cost relative to existing debt, income stability, effect on savings goals, payment history) and any warnings, without locally recomputing or altering any of those figures.

#### Scenario: Offer with warnings
- **WHEN** the terminal offer includes one or more warnings about the offer's risk
- **THEN** every warning is shown to the user alongside the offer, not hidden or summarized away

#### Scenario: Figures are never recomputed client-side
- **WHEN** the terminal offer surface is rendered
- **THEN** every numeric value shown (amount, rate, payment, cost, risk figures) comes directly from the backend response

### Requirement: Accepting an offer requires explicit confirmation before real disbursement
The system SHALL, when the user chooses to accept a terminal offer, show an explicit confirmation step naming the amount and term before submitting the loan for creation, since acceptance immediately and irreversibly disburses funds.

#### Scenario: User confirms
- **WHEN** the user accepts the confirmation step for a shown offer
- **THEN** the system submits the loan for creation using that offer's amount and the loan request's identifier

#### Scenario: User backs out of confirmation
- **WHEN** the user dismisses the confirmation step without confirming
- **THEN** no loan is created and the offer remains available for a later decision

### Requirement: Declining an offer takes no backend action
The system SHALL treat declining a terminal offer as a purely local UI action: no request is sent to the backend, and the user may continue the conversation.

#### Scenario: User declines
- **WHEN** the user declines a shown offer
- **THEN** the offer is dismissed locally and no loan is created

### Requirement: A confirmed loan is reflected across the app immediately
The system SHALL, after a loan is successfully created, refresh the user's account balance and active-loans data so the new loan and its disbursement are visible without a manual app restart or pull-to-refresh.

#### Scenario: Successful creation
- **WHEN** a loan is created and disbursed successfully
- **THEN** the user's account balance and the Préstamos list both reflect the new loan on their next render

#### Scenario: Creation rejected by the backend
- **WHEN** the backend rejects the loan creation (e.g., amount above what was offered)
- **THEN** the system shows the rejection as a handled error, not a crash, and takes no partial action
