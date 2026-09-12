import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from '../../src/catalog/shared/AnimatedPressable';
import { SavingsCard } from '../../src/features/savings/SavingsCard';
import {
  contributeMockFunds,
  createMockSavingsVehicle,
  fetchMockSavings,
  type SavingsVehicle,
  type SavingsVehicleType,
} from '../../src/features/savings/mockSavings';
import { colors, radius, spacing, typography } from '../../src/theme/tokens';

// Local to this screen rather than src/state/queryClient.ts's shared
// `queryKeys` — that file already reserves `saving-bags` for the assistant's
// Saving Bags feature (a different resource per this change's design.md),
// and it's a shared file other parallel lanes are also touching this pass.
const SAVINGS_QUERY_KEY = ['mock-savings-list'] as const;

const VEHICLE_TYPE_LABEL: Record<SavingsVehicleType, string> = {
  flexible: 'Flexible',
  term: 'Plazo fijo',
  goal: 'Meta',
};

export default function ApartadosScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: SAVINGS_QUERY_KEY,
    queryFn: fetchMockSavings,
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [contributeTarget, setContributeTarget] = useState<SavingsVehicle | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const flashSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 2200);
  };

  const createMutation = useMutation({
    mutationFn: createMockSavingsVehicle,
    onSuccess: (vehicle) => {
      queryClient.setQueryData<SavingsVehicle[]>(SAVINGS_QUERY_KEY, (old = []) => [...old, vehicle]);
      setIsCreateOpen(false);
      flashSuccess('Apartado creado');
    },
  });

  const contributeMutation = useMutation({
    mutationFn: contributeMockFunds,
    onSuccess: ({ vehicleId, amount }) => {
      queryClient.setQueryData<SavingsVehicle[]>(SAVINGS_QUERY_KEY, (old = []) =>
        old.map((v) => (v.id === vehicleId ? { ...v, balance: v.balance + amount, monthlyGrowth: v.monthlyGrowth + amount } : v)),
      );
      setContributeTarget(null);
      flashSuccess('Fondos aportados');
    },
  });

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.headerTitle}>Mis apartados</Text>
      </View>

      {successMessage && (
        <Animated.View entering={FadeInDown.duration(200)} exiting={FadeOut.duration(200)} style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={18} color={colors.text.onBrand} />
          <Text style={styles.successBannerText}>{successMessage}</Text>
        </Animated.View>
      )}

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {!isLoading && vehicles.length === 0 ? (
          <Animated.View entering={FadeInUp.duration(280)} style={styles.emptyState}>
            <Ionicons name="save-outline" size={32} color={colors.text.placeholder} />
            <Text style={styles.emptyStateText}>Aún no tienes apartados.{'\n'}Crea el primero para empezar a ahorrar.</Text>
            <AnimatedPressable style={styles.emptyStateButton} onPress={() => setIsCreateOpen(true)}>
              <Text style={styles.emptyStateButtonText}>Crear apartado</Text>
            </AnimatedPressable>
          </Animated.View>
        ) : (
          vehicles.map((vehicle) => (
            <View key={vehicle.id} style={styles.cardWrapper}>
              <SavingsCard vehicle={vehicle} onContribute={() => setContributeTarget(vehicle)} />
            </View>
          ))
        )}
      </ScrollView>

      {vehicles.length > 0 && (
        <Animated.View entering={FadeInUp.duration(280).delay(120)} style={styles.fabWrapper}>
          <AnimatedPressable style={styles.fab} onPress={() => setIsCreateOpen(true)}>
            <Ionicons name="add" size={24} color={colors.text.onBrand} />
            <Text style={styles.fabText}>Nuevo apartado</Text>
          </AnimatedPressable>
        </Animated.View>
      )}

      <CreateSavingsModal
        visible={isCreateOpen}
        isSubmitting={createMutation.isPending}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={(input) => createMutation.mutate(input)}
      />

      <ContributeModal
        vehicle={contributeTarget}
        isSubmitting={contributeMutation.isPending}
        onClose={() => setContributeTarget(null)}
        onSubmit={(amount) => {
          if (!contributeTarget) return;
          contributeMutation.mutate({ vehicleId: contributeTarget.id, amount });
        }}
      />
    </SafeAreaView>
  );
}

type CreateSavingsModalProps = {
  visible: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (input: { name: string; vehicleType: SavingsVehicleType; initialAmount?: number }) => void;
};

// Simulated creation flow (tasks.md §3): submitting never calls a backend —
// it just hands the input to the mutation, which mutates local query-cache
// state and reports success.
function CreateSavingsModal({ visible, isSubmitting, onClose, onSubmit }: CreateSavingsModalProps) {
  const [name, setName] = useState('');
  const [initialAmount, setInitialAmount] = useState('');
  const [vehicleType, setVehicleType] = useState<SavingsVehicleType>('flexible');

  const reset = () => {
    setName('');
    setInitialAmount('');
    setVehicleType('flexible');
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    const parsedAmount = Number(initialAmount.replace(',', '.'));
    onSubmit({
      name: name.trim(),
      vehicleType,
      initialAmount: Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : undefined,
    });
    reset();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Nuevo apartado</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Nombre</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ej. Meta Vacaciones"
              placeholderTextColor={colors.text.placeholder}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Monto inicial (opcional)</Text>
            <TextInput
              style={styles.input}
              value={initialAmount}
              onChangeText={setInitialAmount}
              placeholder="$0.00"
              placeholderTextColor={colors.text.placeholder}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Tipo de apartado</Text>
            <View style={styles.chipRow}>
              {(Object.keys(VEHICLE_TYPE_LABEL) as SavingsVehicleType[]).map((type) => (
                <Pressable
                  key={type}
                  style={[styles.chip, vehicleType === type && styles.chipSelected]}
                  onPress={() => setVehicleType(type)}
                >
                  <Text style={[styles.chipText, vehicleType === type && styles.chipTextSelected]}>
                    {VEHICLE_TYPE_LABEL[type]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <AnimatedPressable
            style={[styles.submitButton, (!name.trim() || isSubmitting) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!name.trim() || isSubmitting}
          >
            <Text style={styles.submitButtonText}>{isSubmitting ? 'Creando...' : 'Crear apartado'}</Text>
          </AnimatedPressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

type ContributeModalProps = {
  vehicle: SavingsVehicle | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (amount: number) => void;
};

function ContributeModal({ vehicle, isSubmitting, onClose, onSubmit }: ContributeModalProps) {
  const [amount, setAmount] = useState('');

  const handleSubmit = () => {
    const parsed = Number(amount.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    onSubmit(parsed);
    setAmount('');
  };

  return (
    <Modal visible={vehicle !== null} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Aportar fondos</Text>
          {vehicle && <Text style={styles.sheetSubtitle}>{vehicle.name}</Text>}

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Monto a aportar</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="$0.00"
              placeholderTextColor={colors.text.placeholder}
              keyboardType="decimal-pad"
              autoFocus
            />
          </View>

          <AnimatedPressable
            style={[styles.submitButton, (!amount.trim() || isSubmitting) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!amount.trim() || isSubmitting}
          >
            <Text style={styles.submitButtonText}>{isSubmitting ? 'Aportando...' : 'Aportar'}</Text>
          </AnimatedPressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface.app },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.brand.primary,
  },
  headerTitle: { ...typography.h3, color: colors.text.onBrand },

  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.text.success,
  },
  successBannerText: { ...typography.label, color: colors.text.onBrand },

  body: { padding: spacing.xl, gap: spacing.lg, paddingBottom: 120, flexGrow: 1 },
  cardWrapper: { width: '100%' },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, paddingTop: 80 },
  emptyStateText: { ...typography.body, color: colors.text.secondary, textAlign: 'center' },
  emptyStateButton: {
    backgroundColor: colors.brand.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
  },
  emptyStateButtonText: { ...typography.button, color: colors.text.onBrand },

  fabWrapper: { position: 'absolute', left: spacing.xxl, right: spacing.xxl, bottom: spacing.xxl },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
    shadowColor: colors.brand.primary,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  fabText: { ...typography.button, color: colors.text.onBrand },

  overlay: { flex: 1, backgroundColor: colors.surface.overlay, justifyContent: 'flex-end' },
  sheetKeyboardWrapper: { width: '100%' },
  sheet: {
    backgroundColor: colors.surface.card,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.xxl,
    gap: spacing.lg,
  },
  sheetTitle: { ...typography.h3, color: colors.text.primary },
  sheetSubtitle: { ...typography.body, color: colors.text.secondary, marginTop: -spacing.sm },

  field: { gap: spacing.sm },
  fieldLabel: { ...typography.label, color: colors.text.secondary },
  input: {
    height: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.field,
    color: colors.text.primary,
    fontSize: typography.body.fontSize,
  },

  chipRow: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.surface.field,
  },
  chipSelected: { borderColor: colors.brand.primary, backgroundColor: colors.surface.card },
  chipText: { ...typography.label, color: colors.text.secondary },
  chipTextSelected: { color: colors.brand.primary },

  submitButton: {
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  submitButtonDisabled: { opacity: 0.4 },
  submitButtonText: { ...typography.button, color: colors.text.onBrand },
});
