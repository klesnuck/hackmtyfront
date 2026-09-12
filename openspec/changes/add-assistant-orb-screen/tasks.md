## 1. Dependencies

- [ ] 1.1 `npx expo install expo-blur`, then `npx expo-doctor` to confirm a clean tree

## 2. Orb component

- [ ] 2.1 Build `features/assistant-orb/AnimatedOrb.tsx`: gradient core + blur glow, matching Figma colors
- [ ] 2.2 Add breathing-scale and gradient-rotation Reanimated animations
- [ ] 2.3 Ensure the animation stops/unmounts cleanly when the idle screen is not visible (no background animation drain)

## 3. Idle screen

- [ ] 3.1 Build the idle screen layout: header, orb, greeting text, two entry buttons
- [ ] 3.2 Wire "Escribir" → active conversation, text input focused
- [ ] 3.3 Wire "Hablar" → active conversation, recording starts immediately

## 4. State machine

- [ ] 4.1 Add idle/active state to the assistant screen (or split into two components with a shared container)
- [ ] 4.2 Return to idle when revisiting the tab with no conversation in progress

## 5. Verification

- [ ] 5.1 `npm run typecheck`, `npm run lint`, `npm run doctor` clean
- [ ] 5.2 Visual check on iOS and Android (or Expo Go on both) — blur renders differently per platform
- [ ] 5.3 Screenshot comparison against Figma node `37:123`
