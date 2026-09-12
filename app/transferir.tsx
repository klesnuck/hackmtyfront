import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedPressable } from '../src/catalog/shared/AnimatedPressable';
import { DestinationRow } from '../src/features/transfers/components/DestinationRow';
import { TransferHeader } from '../src/features/transfers/components/TransferHeader';
import { validateAccountNumber, maskAccountNumber } from '../src/features/transfers/clabe';
import { useTransferStore } from '../src/features/transfers/transfer.store';
import { colors, radius, spacing, typography } from '../src/theme/tokens';

/**
 * Step 1 of the transfer flow (openspec/changes/add-transfers): choose a
 * destination — one of the user's own accounts, or a saved/new third party.
 * Selecting either sets `destination` in the store and advances to amount
 * entry; nothing here submits anything.
 */
export default function TransferirScreen() {
  const ownDestinations = useTransferStore((s) => s.ownDestinations);
  const recipients = useTransferStore((s) => s.recipients);
  const selectDestination = useTransferStore((s) => s.selectDestination);
  const addRecipient = useTransferStore((s) => s.addRecipient);

  const [accountNumber, setAccountNumber] = useState('');
  const [nickname, setNickname] = useState('');
  const [shouldSave, setShouldSave] = useState(true);

  const validation = validateAccountNumber(accountNumber);
  const canContinue = accountNumber.length > 0 && validation.valid && nickname.trim().length > 0;

  const goToAmount = () => router.push('/transferir/monto');

  const handleSelectOwn = (account: (typeof ownDestinations)[number]) => {
    selectDestination({ kind: 'own', account });
    goToAmount();
  };

  const handleSelectRecipient = (recipient: (typeof recipients)[number]) => {
    selectDestination({ kind: 'third-party', recipient });
    goToAmount();
  };

  const handleAddRecipient = () => {
    if (!canContinue) return;
    const recipient = {
      id: `new-${Date.now()}`,
      nickname: nickname.trim(),
      accountNumber,
    };
    if (shouldSave) addRecipient(recipient);
    selectDestination({ kind: 'third-party', recipient });
    setAccountNumber('');
    setNickname('');
    goToAmount();
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <TransferHeader title="Transferir" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(260)} style={styles.section}>
          <Text style={styles.sectionTitle}>Mis cuentas</Text>
          <View style={styles.rows}>
            {ownDestinations.map((account) => (
              <DestinationRow
                key={account.id}
                icon="wallet-outline"
                title={account.label}
                subtitle={account.maskedNumber}
                onPress={() => handleSelectOwn(account)}
              />
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(260).delay(60)} style={styles.section}>
          <Text style={styles.sectionTitle}>Enviar a alguien más</Text>
          <View style={styles.rows}>
            {recipients.map((recipient) => (
              <DestinationRow
                key={recipient.id}
                icon="person-outline"
                title={recipient.nickname}
                subtitle={maskAccountNumber(recipient.accountNumber)}
                onPress={() => handleSelectRecipient(recipient)}
              />
            ))}
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Nuevo destinatario</Text>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>CLABE o número de cuenta</Text>
              <TextInput
                style={styles.input}
                value={accountNumber}
                onChangeText={setAccountNumber}
                placeholder="018180000123456789"
                placeholderTextColor={colors.text.placeholder}
                keyboardType="number-pad"
                maxLength={18}
              />
              {accountNumber.length > 0 && !validation.valid && (
                <Text style={styles.fieldError}>{validation.error}</Text>
              )}
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Apodo</Text>
              <TextInput
                style={styles.input}
                value={nickname}
                onChangeText={setNickname}
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface.app },

  content: { padding: spacing.xl, gap: spacing.xxl, paddingBottom: spacing.xxxl },

  section: { gap: spacing.md },
  sectionTitle: { ...typography.h3, color: colors.text.primary },
  rows: { gap: spacing.md },

  formCard: {
    marginTop: spacing.md,
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
