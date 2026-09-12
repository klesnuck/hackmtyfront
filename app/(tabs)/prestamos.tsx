import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from '../../src/catalog/shared/AnimatedPressable';
import { AbonoModal } from '../../src/features/loans/AbonoModal';
import { LoanCard } from '../../src/features/loans/LoanCard';
import { fetchLoans, type Loan } from '../../src/features/loans/loans';
import { useSessionStore } from '../../src/state/session.store';
import { colors, radius, spacing, typography } from '../../src/theme/tokens';

const TERM_OPTIONS_MONTHS = [6, 12, 24, 36] as const;
const PURPOSE_OPTIONS = ['Personal', 'Auto', 'Hogar', 'Educación', 'Negocio', 'Otro'] as const;

type ApplicationResult = 'approved' | 'pending' | 'rejected' | 'needs_more_info';
type FormStage = 'form' | 'submitting' | 'result';

const RESULT_COPY: Record<
  ApplicationResult,
  { icon: keyof typeof Ionicons.glyphMap; color: string; title: string; body: string }
> = {
  approved: {
    icon: 'checkmark-circle',
    color: colors.text.success,
    title: 'Solicitud aprobada',
    body: 'Tu préstamo fue aprobado. Pronto verás el depósito reflejado.',
  },
  pending: {
    icon: 'time-outline',
    color: colors.brand.primary,
    title: 'Solicitud en revisión',
    body: 'Estamos evaluando tu solicitud. Te avisaremos en cuanto haya una respuesta.',
  },
  rejected: {
    icon: 'close-circle',
    color: colors.text.danger,
    title: 'Solicitud no aprobada',
    body: 'Por ahora no podemos aprobar este préstamo. Puedes intentar con otro monto o plazo.',
  },
  needs_more_info: {
    icon: 'help-circle',
    color: colors.text.secondary,
    title: 'Necesitamos más información',
    body: 'Nos falta información para decidir. Nuestro equipo se pondrá en contacto contigo.',
  },
};

/**
 * The Préstamos tab: active loan list (Figma node 37:160), sourced from the
 * real backend (`GET /api/liabilities`, amitie/backend), plus a manual
 * application entry point (proposal.md — no Figma reference for the form;
 * loan origination has no backend endpoint yet, so that flow is still a UI
 * simulation). "Abonar" applies a real payment against a liability via
 * `AbonoModal` (POST /api/liabilities/{id}/payment).
 */
export default function PrestamosScreen() {
  const insets = useSafeAreaInsets();
  const userId = useSessionStore((s) => s.userId);
  const { data: loans, isLoading } = useQuery({
    queryKey: ['loans', userId],
    queryFn: () => fetchLoans(userId as string),
    enabled: !!userId,
  });
  const [isFormVisible, setFormVisible] = useState(false);
  const [abonoLoan, setAbonoLoan] = useState<Loan | null>(null);

  const openForm = () => setFormVisible(true);
  const closeForm = () => setFormVisible(false);

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.headerTitle}>Mis Préstamos</Text>
        <Ionicons name="notifications-outline" size={24} color={colors.text.onBrand} />
      </View>

      {isLoading ? (
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Cargando préstamos...</Text>
        </View>
      ) : loans && loans.length === 0 ? (
        <EmptyState onApply={openForm} />
      ) : (
        <FlatList
          data={loans ?? []}
          keyExtractor={(loan) => loan.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInUp.duration(260).delay(60 * index)}>
              <LoanCard loan={item} onAbonar={setAbonoLoan} />
            </Animated.View>
          )}
          ListHeaderComponent={
            <AnimatedPressable style={styles.applyButton} onPress={openForm}>
              <Ionicons name="add-circle" size={20} color={colors.text.onBrand} />
              <Text style={styles.applyButtonText}>Solicitar préstamo</Text>
            </AnimatedPressable>
          }
        />
      )}

      <ApplicationModal visible={isFormVisible} onClose={closeForm} />
      <AbonoModal loan={abonoLoan} userId={userId} onClose={() => setAbonoLoan(null)} />
    </SafeAreaView>
  );
}

function EmptyState({ onApply }: { onApply: () => void }) {
  return (
    <Animated.View entering={FadeInUp.duration(280)} style={styles.emptyState}>
      <Ionicons name="cash-outline" size={40} color={colors.text.placeholder} />
      <Text style={styles.emptyStateTitle}>No tienes préstamos activos</Text>
      <Text style={styles.emptyStateBody}>
        Cuando solicites o te aprueben un préstamo, aparecerá aquí.
      </Text>
      <AnimatedPressable style={styles.applyButton} onPress={onApply}>
        <Ionicons name="add-circle" size={20} color={colors.text.onBrand} />
        <Text style={styles.applyButtonText}>Solicitar préstamo</Text>
      </AnimatedPressable>
    </Animated.View>
  );
}

function ApplicationModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [stage, setStage] = useState<FormStage>('form');
  const [amount, setAmount] = useState('');
  const [term, setTerm] = useState<number | null>(null);
  const [purpose, setPurpose] = useState<string | null>(null);
  const [result, setResult] = useState<ApplicationResult>('pending');

  const reset = () => {
    setStage('form');
    setAmount('');
    setTerm(null);
    setPurpose(null);
  };

  const handleClose = () => {
    onClose();
    reset();
  };

  const isValid = Number(amount) > 0 && term !== null && purpose !== null;

  const handleSubmit = () => {
    if (!isValid) return;
    setStage('submitting');
    // UI-only simulated result — no backend call. tasks.md §1 blocks a real
    // submission on the backend team confirming the application response
    // shape; this picks a random outcome purely so the result UI (all four
    // states the spec calls for) can be seen and demoed today.
    const outcomes: ApplicationResult[] = ['approved', 'pending', 'rejected', 'needs_more_info'];
    setTimeout(() => {
      setResult(outcomes[Math.floor(Math.random() * outcomes.length)]);
      setStage('result');
    }, 700);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>
              {stage === 'result' ? RESULT_COPY[result].title : 'Solicitar préstamo'}
            </Text>
            <Pressable onPress={handleClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.text.secondary} />
            </Pressable>
          </View>

          {stage === 'result' ? (
            <View style={styles.resultBlock}>
              <Ionicons name={RESULT_COPY[result].icon} size={48} color={RESULT_COPY[result].color} />
              <Text style={styles.resultBody}>{RESULT_COPY[result].body}</Text>
              <AnimatedPressable style={styles.submitButton} onPress={handleClose}>
                <Text style={styles.submitButtonText}>Entendido</Text>
              </AnimatedPressable>
            </View>
          ) : (
            <>
              <Text style={styles.fieldLabel}>Monto deseado</Text>
              <TextInput
                style={styles.textInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="$0.00"
                placeholderTextColor={colors.text.placeholder}
                keyboardType="numeric"
                editable={stage === 'form'}
              />

              <Text style={styles.fieldLabel}>Plazo</Text>
              <View style={styles.chipRow}>
                {TERM_OPTIONS_MONTHS.map((months) => (
                  <Pressable
                    key={months}
                    style={[styles.chip, term === months && styles.chipSelected]}
                    onPress={() => setTerm(months)}
                    disabled={stage !== 'form'}
                  >
                    <Text style={[styles.chipText, term === months && styles.chipTextSelected]}>
                      {months} meses
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Propósito</Text>
              <View style={styles.chipRow}>
                {PURPOSE_OPTIONS.map((option) => (
                  <Pressable
                    key={option}
                    style={[styles.chip, purpose === option && styles.chipSelected]}
                    onPress={() => setPurpose(option)}
                    disabled={stage !== 'form'}
                  >
                    <Text style={[styles.chipText, purpose === option && styles.chipTextSelected]}>
                      {option}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <AnimatedPressable
                style={[styles.submitButton, (!isValid || stage === 'submitting') && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={!isValid || stage === 'submitting'}
              >
                <Text style={styles.submitButtonText}>
                  {stage === 'submitting' ? 'Enviando...' : 'Enviar solicitud'}
                </Text>
              </AnimatedPressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface.app },

  header: {
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { ...typography.h3, color: colors.text.onBrand },

  list: { padding: spacing.xl, gap: spacing.lg, paddingBottom: 120 },

  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { ...typography.body, color: colors.text.secondary },

  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
    marginBottom: spacing.lg,
  },
  applyButtonText: { ...typography.button, fontSize: 15, color: colors.text.onBrand },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xxxl,
  },
  emptyStateTitle: { ...typography.h3, color: colors.text.primary, textAlign: 'center' },
  emptyStateBody: { ...typography.body, color: colors.text.secondary, textAlign: 'center' },

  overlay: { flex: 1, backgroundColor: colors.surface.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface.card,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.xxl,
    gap: spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sheetTitle: { ...typography.h3, color: colors.text.primary },

  fieldLabel: { ...typography.label, color: colors.text.secondary, marginTop: spacing.sm },
  textInput: {
    height: 48,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface.field,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    color: colors.text.primary,
  },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.field,
  },
  chipSelected: { backgroundColor: colors.brand.primary, borderColor: colors.brand.primary },
  chipText: { ...typography.caption, color: colors.text.secondary },
  chipTextSelected: { color: colors.text.onBrand, fontWeight: '600' },

  submitButton: {
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  submitButtonDisabled: { opacity: 0.4 },
  submitButtonText: { ...typography.button, color: colors.text.onBrand },

  resultBlock: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
  resultBody: { ...typography.body, color: colors.text.secondary, textAlign: 'center' },
});
