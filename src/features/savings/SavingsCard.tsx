import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { AnimatedPressable } from '../../catalog/shared/AnimatedPressable';
import { colors, hitSlop, radius, spacing, typography } from '../../theme/tokens';
import { formatMXN, type SavingsVehicle } from './mockSavings';

// Figma (node 37:266) uses a growth green (#34C759) and its light badge fill
// (#EAF9EE) that aren't in theme/tokens.ts — a shared file other parallel
// lanes are also touching this pass. Kept local until promoted, mirroring
// app/(tabs)/inicio.tsx's precedent for the same situation.
const accent = {
  growthGreen: '#34C759',
  growthBadgeBg: '#EAF9EE',
};

type Props = {
  vehicle: SavingsVehicle;
  onContribute: (vehicleId: string) => void;
};

/**
 * Matches Figma node 37:266's savings card: name + monthly-growth badge,
 * balance, a divider, then annual yield with the "Aportar fondos" affordance.
 */
export function SavingsCard({ vehicle, onContribute }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.name}>{vehicle.name}</Text>
        <View style={styles.growthBadge}>
          <Ionicons name="arrow-up" size={12} color={accent.growthGreen} />
          <Text style={styles.growthText}>+ {formatMXN(vehicle.monthlyGrowth)} este mes</Text>
        </View>
      </View>

      <View style={styles.balanceBlock}>
        <Text style={styles.balanceLabel}>Saldo de ahorro</Text>
        <Text style={styles.balanceAmount}>
          {formatMXN(vehicle.balance)} <Text style={styles.balanceCurrency}>MXN</Text>
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.footerRow}>
        <View style={styles.yieldRow}>
          <Text style={styles.yieldLabel}>Rendimiento anual:</Text>
          <Text style={styles.yieldValue}>{vehicle.annualYieldPercent.toFixed(2)}% GAT</Text>
        </View>
        <AnimatedPressable onPress={() => onContribute(vehicle.id)} hitSlop={hitSlop} disableScaleEffect>
          <Text style={styles.contributeText}>Aportar fondos</Text>
        </AnimatedPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: colors.surface.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  name: { ...typography.bodyStrong, fontSize: 16, fontWeight: '700', color: colors.text.primary },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: accent.growthBadgeBg,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  growthText: { ...typography.caption, fontSize: 11, fontWeight: '600', color: accent.growthGreen },

  balanceBlock: { width: '100%', gap: spacing.xs },
  balanceLabel: { ...typography.caption, color: colors.text.secondary },
  balanceAmount: { ...typography.h2, color: colors.text.primary },
  balanceCurrency: { ...typography.body, fontSize: 14, fontWeight: '500', color: colors.text.primary },

  divider: { width: '100%', height: 1, backgroundColor: colors.border.subtle },

  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  yieldRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  yieldLabel: { ...typography.caption, color: colors.text.secondary },
  yieldValue: { ...typography.caption, fontWeight: '700', color: accent.growthGreen },
  contributeText: { ...typography.caption, fontWeight: '600', color: colors.brand.primary },
});
