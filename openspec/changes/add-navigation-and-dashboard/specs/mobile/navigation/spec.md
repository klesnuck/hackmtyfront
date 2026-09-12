## Purpose

The persistent bottom tab bar shared by every main-app screen (post-login), matching the `bottom-nav` component present in every Figma reference screen (home, préstamos, ahorros).

## ADDED Requirements

### Requirement: Four-tab bottom navigation
The system SHALL show a persistent bottom tab bar with exactly four tabs — Inicio, Préstamos, Apartados, Soporte IA — on every screen reached after login, matching Figma's icon set (home, banknote, piggy-bank, sparkles) and active/inactive coloring (active tab in brand red, inactive in secondary gray).

#### Scenario: Tab bar visible on main screens
- **WHEN** the user is on the Inicio, Préstamos, Apartados, or Soporte IA screen
- **THEN** the bottom tab bar is visible with all four tabs, and the current screen's tab is visually marked active

#### Scenario: Tab bar hidden pre-login
- **WHEN** the user is on the login screen or the initial session-routing screen
- **THEN** no tab bar is shown

### Requirement: Switching tabs preserves each tab's navigation state
The system SHALL preserve each tab's own navigation stack when switching away and back (e.g. a drill-down inside Préstamos is still there after visiting Apartados and returning), per standard Expo Router tab behavior.

#### Scenario: Return to a tab mid-flow
- **WHEN** a user navigates into a sub-screen within one tab, switches to a different tab, then switches back
- **THEN** the original tab shows the same sub-screen it was on, not the tab's root
