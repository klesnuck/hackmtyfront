import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useResolve } from '../../a2ui/context';
import type { A2UINodeProps } from '../../a2ui/registry';
import type { DynamicString } from '../../a2ui/types';
import { colors, radius, spacing, typography } from '../../theme/tokens';

type MonthRow = {
  month?: number;
  payment?: number;
  interest?: number;
  totalBalance?: number;
  cash?: number;
  balanceAfter?: number;
  creditor?: string;
};

const PREVIEW_ROWS = 8;

function money(value: unknown): string {
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  return `$${number.toLocaleString('es-MX', { maximumFractionDigits: 0 })}`;
}

export function PlanTable({ node, scope }: A2UINodeProps) {
  const resolve = useResolve(scope);
  const [expanded, setExpanded] = useState(false);

  const rawMonths = resolve(node.months as DynamicString);
  const months = (Array.isArray(rawMonths) ? rawMonths : []) as MonthRow[];
  const breakMonth = Number(resolve(node.breakMonth as DynamicString) ?? 0);

  if (months.length === 0) return null;
  const visible = expanded ? months : months.slice(0, PREVIEW_ROWS);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.th, styles.colMonth]}>Mes</Text>
        <Text style={[styles.th, styles.colMoney]}>Pago</Text>
        <Text style={[styles.th, styles.colMoney]}>Interés</Text>
        <Text style={[styles.th, styles.colMoney]}>Saldo</Text>
      </View>
      <ScrollView style={styles.body}>
        {visible.map((row, index) => {
          const isBreak = row.month != null && row.month === breakMonth;
          const balance = row.totalBalance ?? row.balanceAfter ?? row.cash;
          return (
            <View key={`${row.month ?? index}-${index}`} style={[styles.tr, isBreak && styles.trBreak]}>
              <Text style={[styles.td, styles.colMonth]}>
                #{row.month ?? index + 1}
                {row.creditor ? ` · ${row.creditor}` : ''}
              </Text>
              <Text style={[styles.td, styles.colMoney]}>{money(row.payment)}</Text>
              <Text style={[styles.td, styles.colMoney]}>{money(row.interest)}</Text>
              <Text style={[styles.td, styles.colMoney]}>{money(balance)}</Text>
            </View>
          );
        })}
      </ScrollView>
      {months.length > PREVIEW_ROWS ? (
        <Pressable onPress={() => setExpanded((prev) => !prev)} style={styles.toggle}>
          <Text style={styles.toggleText}>
            {expanded ? 'Ver menos' : `Ver los ${months.length} meses`}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.card,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    backgroundColor: colors.surface.field,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  th: { ...typography.caption, color: colors.text.secondary, fontWeight: '700' },
  body: { maxHeight: 320 },
  tr: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  trBreak: { backgroundColor: 'rgba(239, 68, 68, 0.08)' },
  td: { ...typography.caption, color: colors.text.primary },
  colMonth: { flex: 1.6 },
  colMoney: { flex: 1, textAlign: 'right' },
  toggle: { paddingVertical: spacing.sm, alignItems: 'center' },
  toggleText: { ...typography.caption, color: colors.brand.primary, fontWeight: '700' },
});
