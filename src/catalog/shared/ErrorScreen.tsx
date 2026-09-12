import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { hitSlop, colors, radius, spacing, typography } from '../../theme/tokens';
import { AnimatedPressable } from './AnimatedPressable';
import { getErrorCopy } from './errorCodes';

type ErrorScreenProps = {
  /** Registry code, e.g. `ERR_NETWORK_001` — see `errorCodes.ts`. Also shown in the code tag. */
  code: string;
  /** Overrides the default description line for `code` (the registry heading is unaffected). */
  message?: string;
  /** Defaults to routing back to the app root, matching "Volver al inicio". */
  onPrimaryAction?: () => void;
};

/**
 * The shared full-screen error state (Figma node 37:351) for unrecoverable
 * failures — see `openspec/changes/add-error-screen`. Reserved for failures
 * a screen can't reasonably recover from inline; routine/recoverable
 * failures (a failed form submit) should show an inline error instead.
 */
export function ErrorScreen({ code, message, onPrimaryAction }: ErrorScreenProps) {
  const copy = getErrorCopy(code);
  const handlePrimaryAction = onPrimaryAction ?? (() => router.replace('/'));

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <AnimatedPressable onPress={() => router.back()} hitSlop={hitSlop} disableScaleEffect>
          <Ionicons name="chevron-back" size={24} color={colors.text.onBrand} />
        </AnimatedPressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark} />
          <Text style={styles.brandText}>BANORTE</Text>
        </View>

        <View style={styles.iconOuterCircle}>
          <View style={styles.iconInnerCircle}>
            <View style={styles.iconBadge}>
              <Ionicons name="alert-circle-outline" size={32} color={colors.text.onBrand} />
            </View>
          </View>
        </View>

        <View style={styles.messageBlock}>
          <Text style={styles.oopsHeading}>¡Oops!</Text>
          <Text style={styles.errorHeading}>{copy.heading}</Text>
          <Text style={styles.errorMessage}>{message ?? copy.message}</Text>
        </View>

        <View style={styles.codeTag}>
          <Text style={styles.codeTagText}>Código de error: {code}</Text>
        </View>

        <View style={styles.actionsBlock}>
          <AnimatedPressable style={styles.primaryButton} onPress={handlePrimaryAction}>
            <Text style={styles.primaryButtonText}>Volver al inicio</Text>
          </AnimatedPressable>

          {/* Presentational only this pass — no support/contact destination is specced yet. */}
          <View style={styles.supportLink}>
            <Text style={styles.supportLinkText}>¿Necesitas ayuda? Contáctanos</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.brand.primary} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface.card },
  header: {
    height: 44,
    backgroundColor: colors.brand.primary,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },

  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
    paddingTop: spacing.xxxl + spacing.sm,
    paddingBottom: spacing.xxxl + spacing.lg,
    gap: spacing.xxxl + spacing.sm,
  },

  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  brandMark: { width: 14, height: 14, borderRadius: 3, backgroundColor: colors.brand.primary },
  brandText: { fontSize: 16, fontWeight: '800', color: colors.text.primary },

  // The Figma badge sits on a very soft brand-tinted circle (#fff5f6) with no
  // token for that tint; deriving it from the brand hex (8-digit alpha) keeps
  // it tied to the token instead of introducing a new hardcoded hex literal.
  iconOuterCircle: {
    width: 140,
    height: 140,
    borderRadius: radius.pill,
    backgroundColor: `${colors.brand.primary}12`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInnerCircle: {
    width: 100,
    height: 100,
    borderRadius: radius.pill,
    backgroundColor: colors.surface.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  messageBlock: { alignItems: 'center', gap: spacing.lg, width: '100%' },
  oopsHeading: { ...typography.h1, fontSize: 44, lineHeight: 52, color: colors.brand.primary, textAlign: 'center' },
  errorHeading: { ...typography.h2, color: colors.text.primary, textAlign: 'center' },
  errorMessage: { ...typography.body, color: colors.text.secondary, textAlign: 'center' },

  codeTag: {
    backgroundColor: colors.surface.field,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  codeTagText: { ...typography.caption, fontWeight: '500', color: colors.text.secondary },

  actionsBlock: { width: '100%', alignItems: 'center', gap: spacing.xxl, paddingTop: spacing.xl },
  primaryButton: {
    width: '100%',
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brand.primary,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  primaryButtonText: { ...typography.button, color: colors.text.onBrand },

  supportLink: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.sm },
  supportLinkText: { fontSize: 14, fontWeight: '600', color: colors.brand.primary },
});
