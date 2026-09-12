import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSessionStore } from '../src/state/session.store';
import { colors } from '../src/theme/tokens';

/**
 * Routing gate: waits for the persisted session_id check (SecureStore) to
 * finish, then sends the user to the login/session-bootstrap screen or
 * straight to the dashboard. Not a real auth guard (SPECS.md §12 — no auth
 * system) — session_id just identifies a mocked demo session.
 */
export default function Index() {
  const hasHydrated = useSessionStore((s) => s.hasHydrated);
  const sessionId = useSessionStore((s) => s.sessionId);

  if (!hasHydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.brand.primary} size="large" />
      </View>
    );
  }

  return <Redirect href={sessionId ? '/dashboard' : '/login'} />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface.app },
});
