## Why

The Figma reference for the assistant screen (node `37:123`, fileKey `G8zaBTJpiBYqLWtdb3DQ6g`) is an **idle greeting screen**: a red header (back chevron + "Asistente IA"), a centered floating glowing orb, a greeting message, and two entry buttons — "Escribir" (keyboard icon) and "Hablar" (mic icon, red). What was built instead is a persistent chat UI (message bubbles + always-visible text input + mic button) with no idle state and no orb — reasonable for an ongoing conversation, but it's not what a user sees on first arriving at the tab, and there's no floating orb at all.

## What Changes

- Adds an idle/greeting screen as the Soporte IA tab's default view: header, animated floating orb, greeting copy, and the two entry buttons.
- "Escribir" transitions into the existing chat UI in text-input mode; "Hablar" transitions into it and immediately starts voice recording. The already-built chat UI (`app/assistant.tsx`'s current content) becomes the "active conversation" state, reached from the idle screen rather than being the tab's landing state.
- Introduces an animated orb component (`features/assistant-orb/`) built on `expo-linear-gradient` (already a dependency) + `expo-blur` + `react-native-reanimated` — no new native dependency beyond `expo-blur`, and no shader/Skia dependency (see `design.md` for why).

## Capabilities

### New Capabilities
- `mobile/assistant`: the Soporte IA tab — idle orb greeting screen plus the active conversation view (chat turns, A2UI surface rendering, voice input) already built.

## Impact

- `app/assistant.tsx` (soon `app/(tabs)/asistente.tsx` per `add-navigation-and-dashboard`) gains a state machine: idle → active conversation, instead of always rendering the chat.
- New dependency: `expo-blur` (official Expo module, install via `npx expo install expo-blur` during apply — SDK-version-matched, not guessed).
- No change to `src/a2ui/` or the catalog — the orb and idle screen are app-shell UI, not agent-generated.
