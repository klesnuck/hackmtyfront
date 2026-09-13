import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { StyleSheet, Text as RNText, View } from 'react-native';
import { useResolve } from '../../a2ui/context';
import type { A2UINodeProps } from '../../a2ui/registry';
import type { DynamicString } from '../../a2ui/types';
import { resolveApiUrl } from '../../api/endpoints';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import { AnimatedPressable } from '../shared/AnimatedPressable';

/** Uses expo-audio, not the deprecated expo-av (removed from Expo Go in SDK 55+). */
export function AudioPlayer({ node, scope }: A2UINodeProps) {
  const resolve = useResolve(scope);
  const rawUrl = resolve(node.url as DynamicString);
  const description = resolve(node.description as DynamicString);
  // The backend may send a relative `/api/audio/...` ref; resolve it against the origin.
  const url = rawUrl ? resolveApiUrl(rawUrl) : undefined;

  const player = useAudioPlayer(url ?? undefined);
  const status = useAudioPlayerStatus(player);

  if (!url) return null;

  const toggle = () => (status.playing ? player.pause() : player.play());

  return (
    <View style={styles.row}>
      <AnimatedPressable onPress={toggle} style={styles.playButton}>
        <Ionicons name={status.playing ? 'pause' : 'play'} size={20} color="#fff" />
      </AnimatedPressable>
      {description && <RNText style={styles.description}>{description}</RNText>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: { ...typography.body, color: colors.text.primary, flexShrink: 1 },
});
