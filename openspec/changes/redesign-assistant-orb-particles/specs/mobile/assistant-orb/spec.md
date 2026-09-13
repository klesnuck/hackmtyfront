## Purpose

The rendering engine behind the Soporte IA tab's floating orb: a voice-reactive particle-sphere renderer built on `@shopify/react-native-skia`, and the platform-specific voice-amplitude source that drives it. Split out from `mobile/assistant` so the orb's own rendering/data contract is documented independently of the screen that hosts it.

## ADDED Requirements

### Requirement: Orb renders as a particle sphere
The system SHALL render the assistant orb as a cloud of particles distributed over a sphere, not a flat gradient shape, using a single-draw-call point-rendering primitive so the particle count does not degrade frame rate on mid-range devices.

#### Scenario: Idle render
- **WHEN** the orb is mounted with `isListening` false
- **THEN** it renders a continuously rotating, gently breathing particle sphere with no per-particle deformation

### Requirement: Orb deformation tracks a single normalized amplitude value
The system SHALL expose the orb's voice-reactivity as a single component prop (`isListening: boolean`) and internally source a normalized amplitude value (0..1) that drives per-particle outward deformation, independent of the orb's own idle rotation/breathing speed.

#### Scenario: Amplitude rises
- **WHEN** the source amplitude value rises
- **THEN** affected particles bulge outward with a fast attack, not an instant snap

#### Scenario: Amplitude falls
- **WHEN** the source amplitude value falls
- **THEN** affected particles ease back toward the resting radius with a slower release than the attack, avoiding visual jitter

### Requirement: Native amplitude reuses the existing mic session
The system SHALL source the orb's amplitude on iOS/Android from the microphone session already opened by the app's speech-recognition flow while listening, and SHALL NOT open a second, independent audio-recording session for this purpose.

#### Scenario: Listening starts
- **WHEN** voice recording starts and speech recognition's mic session becomes active
- **THEN** the orb's amplitude begins tracking that same session's reported volume, without a second permission prompt or a second active recorder

### Requirement: Web amplitude is scoped to active listening only
The system SHALL, on web, only request microphone access for amplitude analysis while `isListening` is true, and SHALL release that access as soon as listening stops.

#### Scenario: Idle on web
- **WHEN** the orb is idle (`isListening` false) on a web build
- **THEN** no microphone permission prompt appears and no audio stream is open

#### Scenario: Listening ends on web
- **WHEN** `isListening` transitions from true to false on a web build
- **THEN** the microphone stream and audio context opened for amplitude analysis are closed
