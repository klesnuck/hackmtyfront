import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { colors, radius, spacing, typography } from '../../theme/tokens';

/**
 * Static, client-local nudge shown near the floating orb (no backend
 * involvement — design.md Decision "Suggested-prompt rotation"). Each prompt
 * animates in, rests for a few seconds, animates out, then the next one
 * appears, on a repeating interval that is cleared on unmount.
 */
const DEFAULT_PROMPTS = [
  '¿Tienes otra duda?',
  '¿Quieres saber algo más?',
  '¿Te gustaría cambiar tu préstamo?',
];

const PROMPT_VISIBLE_MS = 4000;
const PROMPT_GAP_MS = 450;

type Props = {
  prompts?: string[];
  onSelect: (prompt: string) => void;
};

export function SuggestedPrompts({ prompts = DEFAULT_PROMPTS, onSelect }: Props) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const count = prompts.length;

  useEffect(() => {
    if (count === 0) return;
    let gapTimer: ReturnType<typeof setTimeout> | undefined;
    const cycle = setInterval(() => {
      setVisible(false);
      gapTimer = setTimeout(() => {
        setIndex((current) => (current + 1) % count);
        setVisible(true);
      }, PROMPT_GAP_MS);
    }, PROMPT_VISIBLE_MS);

    return () => {
      clearInterval(cycle);
      if (gapTimer) clearTimeout(gapTimer);
    };
  }, [count]);

  if (count === 0) return null;
  const prompt = prompts[index];

  return (
    <View style={styles.container} pointerEvents="box-none">
      {visible && (
        <Animated.View
          key={prompt}
          entering={FadeInDown.duration(300)}
          exiting={FadeOutDown.duration(220)}
        >
          <Pressable style={styles.bubble} onPress={() => onSelect(prompt)}>
            <Text style={styles.text}>{prompt}</Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'flex-end', maxWidth: 260 },
  bubble: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  text: { ...typography.body, color: colors.text.primary },
});
