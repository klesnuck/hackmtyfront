import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAccounts, getRecipients } from '../src/api/endpoints';
import type { Account, Recipient } from '../src/api/types';
import { AnimatedPressable } from '../src/catalog/shared/AnimatedPressable';
import { formatAccountKind, formatBalance } from '../src/features/dashboard/format';
import { BANK_OPTIONS } from '../src/features/transfers/banks';
import { maskAccountNumber, validateClabe } from '../src/features/transfers/clabe';
import { AccountOptionRow } from '../src/features/transfers/components/AccountOptionRow';
import { BankPicker } from '../src/features/transfers/components/BankPicker';
import { DestinationRow } from '../src/features/transfers/components/DestinationRow';
import { EmptyState } from '../src/features/transfers/components/EmptyState';
import { TransferHeader } from '../src/features/transfers/components/TransferHeader';
import { useTransferStore } from '../src/features/transfers/transfer.store';
import type { TransferMode } from '../src/features/transfers/types';
import { useSessionStore } from '../src/state/session.store';
import { colors, radius, spacing, typography } from '../src/theme/tokens';

/**
 * Step 1 of the transfer flow (openspec/changes/redesign-transfers-real-data):
 * a two-tab segmented control — "Transferir a otros" (saved/new recipient by
 * CLABE) and "Transferir entre mis cuentas" (real account pickers) — replacing
 * the old single merged "Mis cuentas"/"Enviar a alguien más" list. Both tabs
 * read real backend data (`['accounts', userId]`, the same key Inicio/
 * AbonoModal already use, and a new `['recipients', userId]`) instead of the
 * removed mock files. Selecting either sets the store's draft and advances to
 * amount entry; nothing here submits anything.
 */
export default function TransferirScreen() {
  const userId = useSessionStore((s) => s.userId);
  const mode = useTransferStore((s) => s.mode);
  const selectMode = useTransferStore((s) => s.selectMode);

  const activeTab: TransferMode = mode ?? 'others';

  const { data: accountsData, isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts', userId],
    queryFn: () => getAccounts(userId as string),
    enabled: !!userId,
  });
  const { data: recipientsData, isLoading: recipientsLoading } = useQuery({
    queryKey: ['recipients', userId],
    queryFn: () => getRecipients(userId as string),
    enabled: !!userId,
  });

  const accounts = accountsData?.accounts ?? [];
  const recipients = recipientsData?.recipients ?? [];

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <TransferHeader title="Transferir" />

      <View style={styles.segmentedControl}>
        <AnimatedPressable
          style={[styles.segment, activeTab === 'others' && styles.segmentActive]}
          onPress={() => selectMode('others')}
        >
          <Text style={[styles.segmentLabel, activeTab === 'others' && styles.segmentLabelActive]}>
            Transferir a otros
          </Text>
        </AnimatedPressable>
        <AnimatedPressable
          style={[styles.segment, activeTab === 'own' && styles.segmentActive]}
          onPress={() => selectMode('own')}
        >
          <Text style={[styles.segmentLabel, activeTab === 'own' && styles.segmentLabelActive]}>
            Transferir entre mis cuentas
          </Text>
        </AnimatedPressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {accountsLoading || recipientsLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.brand.primary} />
          </View>
        ) : activeTab === 'others' ? (
          <OthersTab accounts={accounts} recipients={recipients} />
        ) : (
          <OwnAccountsTab accounts={accounts} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function defaultSourceAccountId(accounts: Account[]): string | null {
  return accounts.find((a) => a.kind === 'checking')?.id ?? accounts[0]?.id ?? null;
}

function OthersTab({ accounts, recipients }: { accounts: Account[]; recipients: Recipient[] }) {
  const selectSource = useTransferStore((s) => s.selectSource);
  const selectDestination = useTransferStore((s) => s.selectDestination);

  const [clabe, setClabe] = useState('');
  const [alias, setAlias] = useState('');
  const [bankName, setBankName] = useState<string>(BANK_OPTIONS[0]);
  const [shouldSave, setShouldSave] = useState(true);

  const validation = validateClabe(clabe);
  const canContinue = clabe.length > 0 && validation.valid && alias.trim().length > 0;

  const goToAmount = () => router.push('/transferir/monto');

  const handleSelectRecipient = (recipient: Recipient) => {
    const sourceId = defaultSourceAccountId(accounts);
    if (!sourceId) return;
    selectSource(sourceId);
    selectDestination({
      kind: 'external',
      alias: recipient.alias,
      clabe: recipient.clabe,
      bankName: recipient.bankName,
      saveRecipient: false, // already saved — nothing new to persist
    });
    goToAmount();
  };

  const handleAddRecipient = () => {
    if (!canContinue) return;
    const sourceId = defaultSourceAccountId(accounts);
    if (!sourceId) return;
    selectSource(sourceId);
    selectDestination({
      kind: 'external',
      alias: alias.trim(),
      clabe,
      bankName,
      saveRecipient: shouldSave,
    });
    setClabe('');
    setAlias('');
    goToAmount();
  };

  return (
    <>
      <Animated.View entering={FadeInUp.duration(260)} style={styles.section}>
        <Text style={styles.sectionTitle}>Mis destinatarios</Text>
        {recipients.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="Aún no tienes destinatarios guardados"
            message="Agrega uno nuevo abajo con su CLABE, banco y alias."
          />
        ) : (
          <View style={styles.rows}>
            {recipients.map((recipient) => (
              <DestinationRow
                key={recipient.id}
                icon="person-outline"
                title={recipient.alias}
                subtitle={`${recipient.bankName} · ${maskAccountNumber(recipient.clabe)}`}
                onPress={() => handleSelectRecipient(recipient)}
              />
            ))}
          </View>
        )}
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(260).delay(60)} style={styles.section}>
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Transferir a nuevo destinatario</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>CLABE</Text>
            <TextInput
              style={styles.input}
              value={clabe}
              onChangeText={setClabe}
              placeholder="018180000123456789"
              placeholderTextColor={colors.text.placeholder}
              keyboardType="number-pad"
              maxLength={18}
            />
            {clabe.length > 0 && !validation.valid && (
              <Text style={styles.fieldError}>{validation.error}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Banco</Text>
            <BankPicker value={bankName} onChange={setBankName} />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Alias</Text>
            <TextInput
              style={styles.input}
              value={alias}
              onChangeText={setAlias}
              placeholder="Ej. Mamá, Renta"
              placeholderTextColor={colors.text.placeholder}
            />
          </View>

          <View style={styles.saveRow}>
            <Text style={styles.fieldLabel}>Guardar para la próxima vez</Text>
            <Switch
              value={shouldSave}
              onValueChange={setShouldSave}
              trackColor={{ false: colors.border.strong, true: colors.brand.primary }}
              thumbColor="#fff"
            />
          </View>

          <AnimatedPressable
            style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
            onPress={handleAddRecipient}
            disabled={!canContinue}
          >
            <Text style={styles.continueButtonText}>Continuar</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.text.onBrand} />
          </AnimatedPressable>
        </View>
      </Animated.View>
    </>
  );
}

function OwnAccountsTab({ accounts }: { accounts: Account[] }) {
  const selectSource = useTransferStore((s) => s.selectSource);
  const selectDestination = useTransferStore((s) => s.selectDestination);

  const [originId, setOriginId] = useState<string | null>(null);
  const [destinationId, setDestinationId] = useState<string | null>(null);

  if (accounts.length < 2) {
    return (
      <EmptyState
        icon="wallet-outline"
        title="Necesitas una segunda cuenta"
        message="Transferir entre tus cuentas requiere al menos dos cuentas propias."
      />
    );
  }

  const canContinue = !!originId && !!destinationId && originId !== destinationId;

  const handleContinue = () => {
    if (!canContinue || !originId || !destinationId) return;
    const destinationAccount = accounts.find((a) => a.id === destinationId);
    if (!destinationAccount) return;
    selectSource(originId);
    selectDestination({
      kind: 'own',
      accountId: destinationAccount.id,
      label: `${destinationAccount.institution ?? 'Mi cuenta'} · ${formatAccountKind(destinationAccount.kind)}`,
      accountLine: destinationAccount.id,
    });
    router.push('/transferir/monto');
  };

  return (
    <>
      <Animated.View entering={FadeInUp.duration(260)} style={styles.section}>
        <Text style={styles.sectionTitle}>Origen</Text>
        <View style={styles.rows}>
          {accounts.map((account) => (
            <AccountOptionRow
              key={account.id}
              title={`${account.institution ?? 'Mi cuenta'} · ${formatAccountKind(account.kind)}`}
              subtitle={`${formatBalance(account.balance)} ${account.currency}`}
              selected={originId === account.id}
              onPress={() => {
                setOriginId(account.id);
                if (destinationId === account.id) setDestinationId(null);
              }}
            />
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(260).delay(60)} style={styles.section}>
        <Text style={styles.sectionTitle}>Destino</Text>
        <View style={styles.rows}>
          {accounts.map((account) => (
            <AccountOptionRow
              key={account.id}
              title={`${account.institution ?? 'Mi cuenta'} · ${formatAccountKind(account.kind)}`}
              subtitle={`${formatBalance(account.balance)} ${account.currency}`}
              selected={destinationId === account.id}
              disabled={originId === account.id}
              onPress={() => setDestinationId(account.id)}
            />
          ))}
        </View>
      </Animated.View>

      <AnimatedPressable
        style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
        onPress={handleContinue}
        disabled={!canContinue}
      >
        <Text style={styles.continueButtonText}>Continuar</Text>
        <Ionicons name="arrow-forward" size={18} color={colors.text.onBrand} />
      </AnimatedPressable>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface.app },

  segmentedControl: {
    flexDirection: 'row',
    marginHorizontal: spacing.xl,
    backgroundColor: colors.surface.field,
    borderRadius: radius.pill,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  segmentActive: { backgroundColor: colors.surface.card },
  segmentLabel: { ...typography.label, color: colors.text.secondary, textAlign: 'center' },
  segmentLabelActive: { color: colors.text.primary },

  content: { padding: spacing.xl, gap: spacing.xxl, paddingBottom: spacing.xxxl },
  loading: { paddingVertical: spacing.xxxl, alignItems: 'center' },

  section: { gap: spacing.md },
  sectionTitle: { ...typography.h3, color: colors.text.primary },
  rows: { gap: spacing.md },

  formCard: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  formTitle: { ...typography.bodyStrong, color: colors.text.primary },

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
  fieldError: { ...typography.caption, color: colors.text.danger },

  saveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
  },
  continueButtonDisabled: { opacity: 0.4 },
  continueButtonText: { ...typography.button, color: colors.text.onBrand },
});
