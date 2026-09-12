import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Side-effect imports: each catalog registers itself with src/a2ui/registry.ts
// on module load. They must run before any <A2UISurface /> renders — doing it
// here, once, at app startup, guarantees that.
import '../src/catalog/standard';
import '../src/catalog/voz-color';

import { queryClient } from '../src/state/queryClient';
import { useSessionStore } from '../src/state/session.store';
import { colors } from '../src/theme/tokens';

// Catalog parity (REQ-ACC-02: standard and voz-color must implement the same
// node types) is enforced at compile time by CatalogRegistry's closed
// BasicNodeType union (src/a2ui/registry.ts) — a catalog missing a type fails
// `tsc`, so there's no runtime check needed here.

export default function RootLayout() {
  const hydrateFromStorage = useSessionStore((s) => s.hydrateFromStorage);

  useEffect(() => {
    void hydrateFromStorage();
  }, [hydrateFromStorage]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.surface.app },
              animation: 'fade',
            }}
          />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
