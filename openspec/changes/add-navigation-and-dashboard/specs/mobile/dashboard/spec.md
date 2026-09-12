## Purpose

The Inicio tab's content: the fixed (non-agent-generated) home shell that greets the user, surfaces the AI assistant, shows account balance, and offers quick actions — matching Figma node `37:42`.

## ADDED Requirements

### Requirement: Header greets the user and surfaces notifications
The system SHALL show a red header with a time-of-day greeting, the user's display name, an initials avatar, and a notification bell affordance.

#### Scenario: Greeting renders with session user data
- **WHEN** the dashboard loads for a session with a known display name
- **THEN** the header shows "Hola, buen día" (or an appropriate time-of-day variant) followed by the user's name, and an avatar with their initials

### Requirement: AI banner promotes the assistant and routes to the intent picker
The system SHALL show a dark promotional card ("Asistente de Préstamos IA") with a tap target that navigates to `app/asistente-prestamos.tsx` — the existing La Mesa / Saving Bags intent-picker screen (repurposed, see `design.md`'s "Repurposing decision") — not the Soporte IA tab directly. That screen hands the user off to the assistant with a specific intent already attached.

#### Scenario: Tapping the AI banner
- **WHEN** the user taps the AI banner's arrow affordance
- **THEN** the app navigates to `app/asistente-prestamos.tsx`, where the user picks a specific need before reaching the assistant with that intent attached

### Requirement: Account balance card shows masked account info
The system SHALL show a card with the account holder's bank account label, a masked account number, the available balance, and the CLABE with a copy-to-clipboard affordance.

#### Scenario: Copy CLABE
- **WHEN** the user taps the copy icon next to the CLABE
- **THEN** the CLABE value is copied to the clipboard and the user gets a brief visual confirmation

### Requirement: Quick actions route to the correct tab or flow
The system SHALL show three quick-action shortcuts (Ahorros, Préstamos, Transferir) that navigate to the Apartados tab, the Préstamos tab, and the transfer flow respectively.

#### Scenario: Quick action navigation
- **WHEN** the user taps the "Ahorros" quick action
- **THEN** the app switches to the Apartados tab

### Requirement: Balance data is clearly mocked pending a backend contract
The system SHALL source the balance/CLABE/account data from a single, clearly-marked mock data module until a real endpoint exists in the backend's frozen contract, so swapping to a real endpoint later is a one-file change.

#### Scenario: No live account endpoint yet
- **WHEN** the dashboard renders balance data
- **THEN** it reads from a single typed mock module rather than duplicating hardcoded values across components
