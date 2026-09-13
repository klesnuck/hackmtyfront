import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useA2UISurfaceContext, useDispatchAction, useResolve } from '../../a2ui/context';
import type { A2UINodeProps } from '../../a2ui/registry';
import type { DynamicString } from '../../a2ui/types';
import type { LoanRisk, LoanScheduleRow } from '../../api/types';
import { AnimatedPressable } from '../shared/AnimatedPressable';
import { colors, radius, spacing, typography } from '../../theme/tokens';

function formatCurrency(val: number | undefined | null): string {
  if (val == null || isNaN(val)) return '$0.00';
  return `$${val.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPercent(val: number | undefined | null): string {
  if (val == null || isNaN(val)) return '0%';
  return `${(val * 100).toFixed(1)}%`;
}

export function LoanOffer({ node, scope }: A2UINodeProps) {
  const resolve = useResolve(scope);
  const dispatchAction = useDispatchAction(node, scope);
  const { dataModel } = useA2UISurfaceContext();

  const [showSchedule, setShowSchedule] = useState(false);
  const [declined, setDeclined] = useState(false);

  // Extract props (literals or dynamic bindings)
  const amount = Number(resolve(node.amount as DynamicString) ?? 0);
  const apr = Number(resolve(node.apr as DynamicString) ?? 0);
  const months = Number(resolve(node.months as DynamicString) ?? 0);
  const monthlyPayment = Number(resolve(node.monthlyPayment as DynamicString) ?? 0);
  const totalInterest = Number(resolve(node.totalInterest as DynamicString) ?? 0);
  const cat = Number(resolve(node.cat as DynamicString) ?? 0);
  const totalCost = Number(resolve(node.totalCost as DynamicString) ?? (amount + totalInterest));

  const schedule = (resolve(node.schedule as DynamicString) as LoanScheduleRow[] | undefined) ?? [];

  // Deep extract risk data from dataModel if available
  const dmObj = (dataModel as Record<string, unknown>) || {};
  const loanData = (dmObj.loan as Record<string, unknown>) || {};
  const risk = (loanData.risk as LoanRisk | undefined);
  const warnings = (loanData.warnings as string[] | undefined) ?? [];

  const canAccept = amount > 0;

  const handleAccept = () => {
    if (!canAccept) return;
    // Dispatches request_loan action with the offer terms
    dispatchAction({
      amount,
      months,
      apr,
      monthlyPayment,
    });
  };

  const handleDecline = () => {
    setDeclined(true);
  };

  if (declined) {
    return (
      <View style={[styles.card, styles.declinedCard]}>
        <Ionicons name="close-circle-outline" size={32} color={colors.text.secondary} />
        <Text style={styles.declinedText}>Has declinado esta oferta de préstamo.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {/* Header Banner */}
      <View style={styles.header}>
        <View style={styles.badgeRow}>
          <View style={styles.tag}>
            <Ionicons name="sparkles" size={14} color={colors.brand.primary} />
            <Text style={styles.tagText}>Oferta Personalizada</Text>
          </View>
        </View>
        <Text style={styles.amountLabel}>Monto pre-aprobado</Text>
        <Text style={styles.amountValue}>{formatCurrency(amount)}</Text>
      </View>

      {/* Main Metrics Grid */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Pago mensual</Text>
          <Text style={styles.metricValuePrimary}>{formatCurrency(monthlyPayment)}</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Plazo</Text>
          <Text style={styles.metricValue}>{months} meses</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Tasa de interés (APR)</Text>
          <Text style={styles.metricValue}>{formatPercent(apr)}</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>CAT (aproximado)</Text>
          <Text style={styles.metricValue}>{formatPercent(cat)}</Text>
        </View>
      </View>

      {/* Total Cost Summary */}
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Costo total del crédito</Text>
        <Text style={styles.summaryValue}>{formatCurrency(totalCost)}</Text>
      </View>

      {/* Warnings & Risk Insights (if present) */}
      {warnings.length > 0 && (
        <View style={styles.warningsBox}>
          <View style={styles.warningTitleRow}>
            <Ionicons name="warning-outline" size={16} color="#B45309" />
            <Text style={styles.warningTitle}>Factores a considerar</Text>
          </View>
          {warnings.map((warn, i) => (
            <Text key={i} style={styles.warningItem}>
              • {warn}
            </Text>
          ))}
        </View>
      )}

      {/* Risk Metrics Quick View */}
      {risk && (
        <View style={styles.riskPanel}>
          <Text style={styles.riskPanelTitle}>Evaluación financiera</Text>
          <View style={styles.riskRow}>
            <Text style={styles.riskLabel}>Capacidad de pago (DTI)</Text>
            <Text style={[styles.riskValue, risk.dti.flag && styles.riskValueAlert]}>
              {risk.dti.withOffer ? formatPercent(risk.dti.withOffer) : 'Saludable'}
            </Text>
          </View>
          {risk.paymentHistory?.available && (
            <View style={styles.riskRow}>
              <Text style={styles.riskLabel}>Historial de pago a tiempo</Text>
              <Text style={styles.riskValue}>
                {formatPercent(risk.paymentHistory.onTimeRatio ?? 1.0)}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Collapsible Amortization Table */}
      {schedule.length > 0 && (
        <View style={styles.scheduleSection}>
          <Pressable style={styles.scheduleToggle} onPress={() => setShowSchedule((prev) => !prev)}>
            <Text style={styles.scheduleToggleText}>
              {showSchedule ? 'Ocultar tabla de amortización' : 'Ver tabla de amortización'}
            </Text>
            <Ionicons
              name={showSchedule ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.brand.primary}
            />
          </Pressable>

          {showSchedule && (
            <View style={styles.tableContainer}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { flex: 0.8 }]}>Mes</Text>
                <Text style={[styles.th, { flex: 1.2 }]}>Pago</Text>
                <Text style={[styles.th, { flex: 1.2 }]}>Interés</Text>
                <Text style={[styles.th, { flex: 1.2 }]}>Capital</Text>
              </View>
              {schedule.map((row) => (
                <View key={row.month} style={styles.tableRow}>
                  <Text style={[styles.td, { flex: 0.8 }]}>#{row.month}</Text>
                  <Text style={[styles.td, { flex: 1.2 }]}>{formatCurrency(row.payment)}</Text>
                  <Text style={[styles.td, { flex: 1.2 }]}>{formatCurrency(row.interest)}</Text>
                  <Text style={[styles.td, { flex: 1.2 }]}>{formatCurrency(row.principal)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Action Buttons */}
      {canAccept ? (
        <View style={styles.actionsRow}>
          <AnimatedPressable style={styles.acceptButton} onPress={handleAccept}>
            <Ionicons name="checkmark-circle" size={20} color={colors.text.onBrand} />
            <Text style={styles.acceptButtonText}>Aceptar préstamo</Text>
          </AnimatedPressable>

          <AnimatedPressable style={styles.declineButton} onPress={handleDecline}>
            <Text style={styles.declineButtonText}>Declinar</Text>
          </AnimatedPressable>
        </View>
      ) : (
        <View style={styles.actionsRow}>
          <AnimatedPressable style={styles.declineButton} onPress={handleDecline}>
            <Text style={styles.declineButtonText}>Entendido</Text>
          </AnimatedPressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.xl,
    gap: spacing.lg,
    marginVertical: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  header: {
    gap: spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(236, 0, 41, 0.08)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  tagText: {
    ...typography.caption,
    color: colors.brand.primary,
    fontWeight: '700',
  },
  amountLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountValue: {
    ...typography.h1,
    color: colors.brand.primary,
    fontSize: 32,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.surface.field,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  metricItem: {
    width: '46%',
    gap: 2,
  },
  metricLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  metricValuePrimary: {
    ...typography.bodyStrong,
    color: colors.text.primary,
    fontSize: 17,
  },
  metricValue: {
    ...typography.bodyStrong,
    color: colors.text.primary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: spacing.md,
  },
  summaryLabel: {
    ...typography.body,
    color: colors.text.secondary,
  },
  summaryValue: {
    ...typography.bodyStrong,
    color: colors.text.primary,
  },
  warningsBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  warningTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  warningTitle: {
    ...typography.label,
    color: '#B45309',
  },
  warningItem: {
    ...typography.caption,
    color: '#92400E',
    lineHeight: 18,
  },
  riskPanel: {
    backgroundColor: colors.surface.field,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  riskPanelTitle: {
    ...typography.label,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  riskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  riskLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  riskValue: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '600',
  },
  riskValueAlert: {
    color: colors.text.danger,
  },
  scheduleSection: {
    gap: spacing.sm,
  },
  scheduleToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  scheduleToggleText: {
    ...typography.label,
    color: colors.brand.primary,
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.surface.field,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  th: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  td: {
    ...typography.caption,
    color: colors.text.primary,
  },
  actionsRow: {
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  acceptButton: {
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    shadowColor: colors.brand.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  acceptButtonText: {
    ...typography.button,
    color: colors.text.onBrand,
  },
  declineButton: {
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  declineButtonText: {
    ...typography.label,
    color: colors.text.secondary,
  },
  declinedCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.sm,
  },
  declinedText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
