import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { colors, typography } from '../../src/theme/tokens';

type TabIconName = keyof typeof Ionicons.glyphMap;

/**
 * The 4-tab shell shared across the main app screens (Figma bottom-nav
 * component, nodes 37:42/37:160/37:266). Screens live as siblings under this
 * group; `app/login.tsx` and `app/index.tsx` stay outside it (pre-session).
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand.primary,
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarStyle: {
          backgroundColor: colors.surface.card,
          borderTopColor: colors.border.subtle,
        },
        tabBarLabelStyle: { ...typography.caption, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="inicio"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={(focused ? 'home' : 'home-outline') as TabIconName} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="prestamos"
        options={{
          title: 'Préstamos',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={(focused ? 'cash' : 'cash-outline') as TabIconName} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="apartados"
        options={{
          title: 'Apartados',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={(focused ? 'save' : 'save-outline') as TabIconName} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="asistente"
        options={{
          title: 'Soporte IA',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={(focused ? 'sparkles' : 'sparkles-outline') as TabIconName} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
