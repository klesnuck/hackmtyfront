import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedPressable } from '../src/catalog/shared/AnimatedPressable';
import { colors, radius, spacing, typography } from '../src/theme/tokens';

type QuickAction = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
};

/**
 * Intermediate routing panel reached from the Inicio dashboard's "Asistente
 * de Préstamos IA" banner (see openspec/changes/add-navigation-and-dashboard
 * /design.md "Repurposing decision") — not a generic dashboard. Its job is
 * narrowing down which specific thing the user wants (La Mesa vs. Saving
 * Bags) before handing off to the assistant with that intent attached. A
 * pushed stack screen now, not the landing screen, hence the back chevron.
 */
export default function AsistentePrestamosScreen() {
  const actions: QuickAction[] = [
    {
      key: 'la-mesa',
      icon: 'wallet-outline',
      title: 'Manejar mi deuda',
      subtitle: 'La Mesa — reestructura y negocia',
      onPress: () => router.push({ pathname: '/asistente', params: { intent: 'la-mesa' } }),
    },
    {
      key: 'prestamo-nuevo',
      icon: 'cash-outline',
      title: 'Solicitar un préstamo nuevo',
      subtitle: 'Consulta inteligente y crédito inmediato',
      onPress: () => router.push({ pathname: '/asistente', params: { intent: 'prestamo-nuevo' } }),
    },
    {
      key: 'saving-bags',
      icon: 'save-outline',
      title: 'Nueva meta de ahorro',
      subtitle: 'Saving Bags — dile a dónde quieres llegar',
      onPress: () => router.push({ pathname: '/asistente', params: { intent: 'saving-bags' } }),
    },
  ];


  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.topBarTitle}>Asistente de Préstamos</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(280)} style={styles.greetingBlock}>
          <Text style={styles.greetingEyebrow}>Bienvenido de nuevo</Text>
          <Text style={styles.greetingTitle}>¿Qué necesitas resolver hoy?</Text>
        </Animated.View>

        <View style={styles.actions}>
          {actions.map((action, index) => (
            <Animated.View key={action.key} entering={FadeInUp.duration(280).delay(80 * (index + 1))}>
              <AnimatedPressable style={styles.actionCard} onPress={action.onPress}>
                <View style={styles.actionIcon}>
                  <Ionicons name={action.icon} size={24} color={colors.brand.primary} />
                </View>
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.text.placeholder} />
              </AnimatedPressable>
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      <Animated.View entering={FadeInUp.duration(320).delay(240)} style={styles.assistantCta}>
        <AnimatedPressable
          style={styles.assistantButton}
          onPress={() => router.push({ pathname: '/asistente', params: {} })}
        >
          <Ionicons name="mic" size={22} color={colors.text.onBrand} />
          <Text style={styles.assistantButtonText}>Habla con tu asistente</Text>
        </AnimatedPressable>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface.app },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  topBarTitle: { ...typography.bodyStrong, color: colors.text.primary },

  content: { padding: spacing.xxl, gap: spacing.xxl, paddingBottom: 120 },

  greetingBlock: { gap: spacing.xs },
  greetingEyebrow: { ...typography.label, color: colors.text.secondary },
  greetingTitle: { ...typography.h1, color: colors.text.primary },

  actions: { gap: spacing.md },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.lg,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surface.field,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { flex: 1, gap: 2 },
  actionTitle: { ...typography.bodyStrong, color: colors.text.primary },
  actionSubtitle: { ...typography.caption, color: colors.text.secondary },

  assistantCta: {
    position: 'absolute',
    left: spacing.xxl,
    right: spacing.xxl,
    bottom: spacing.xxl,
  },
  assistantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
    shadowColor: colors.brand.primary,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  assistantButtonText: { ...typography.button, color: colors.text.onBrand },
});
