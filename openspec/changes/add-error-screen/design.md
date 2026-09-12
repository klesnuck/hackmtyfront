## Context

No error-handling convention exists yet beyond the assistant chat's inline system-turn messages (`app/assistant.tsx`'s `submitText`/`submitAudio` catch blocks). As more screens are added (loans, savings, transfers), each will hit failure modes — better to establish the shared component and the recoverable-vs-unrecoverable line now, before those changes duplicate ad hoc error handling.

## Goals / Non-Goals

**Goals:**
- One component, reusable from any screen, matching Figma exactly.
- A clear, written rule for when to use it vs. an inline error — prevents it from being overused into a jarring full-screen takeover for minor failures.

**Non-Goals:**
- Does not build a global error boundary / crash reporter — this is a designed UI state for known failure paths (a request that failed), not a catch-all for uncaught JS exceptions. That's a separate, lower-priority concern for a hackathon timeline.

## Decisions

- **Implemented as a component invoked by the calling screen (`<ErrorScreen code="..." onRetry={...} />` or similar), not a dedicated route** — most callers will want to show it in place of their own content rather than navigate away and lose context, except for the specific "Volver al inicio" action which does navigate.
- **Error codes follow a simple `ERR_<area>_<number>` convention** (matching Figma's example `ERR_09_023`) — exact registry of codes defined during `apply`, once real failure categories are enumerated across the screens that use it.

## Risks / Trade-offs

- Risk of overuse: if every screen reaches for this component for routine failures, it undermines the "designed to be rare" nature of a full-screen error state. The last delta-spec requirement (reserved for unrecoverable failures) is the guardrail — enforce it in code review as other changes adopt this component.
