import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../../theme/tokens';

type Props = {
  title: string;
  /** Defaults to router.back(); override for steps that need custom exit behavior. */
  onBack?: () => void;
};

/** Shared top bar for every step of the transfer flow — matches app/assistant.tsx's pushed-screen header. */
export function TransferHeader({ title, onBack }: Props) {
  return (
    <View style={styles.topBar}>
      <Pressable onPress={onBack ?? (() => router.back())} hitSlop={8}>
        <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
      </Pressable>
      <Text style={styles.title}>{title}</Text>
      <View style={{ width: 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  title: { ...typography.bodyStrong, color: colors.text.primary },
});
