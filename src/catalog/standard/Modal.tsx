import { useState } from 'react';
import { Modal as RNModal, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { A2UINodeById } from '../../a2ui/renderer';
import type { A2UINodeProps } from '../../a2ui/registry';
import type { ComponentId } from '../../a2ui/types';
import { colors, radius, spacing } from '../../theme/tokens';

export function Modal({ node, scope }: A2UINodeProps) {
  const [visible, setVisible] = useState(false);
  const trigger = node.trigger as ComponentId | undefined;
  const content = node.content as ComponentId | undefined;

  return (
    <>
      <Pressable onPress={() => setVisible(true)}>
        {trigger && <A2UINodeById id={trigger} scope={scope} />}
      </Pressable>
      <RNModal visible={visible} transparent animationType="none" onRequestClose={() => setVisible(false)}>
        <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)} style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setVisible(false)} />
          <Animated.View entering={SlideInDown.springify().damping(18)} exiting={SlideOutDown.duration(200)} style={styles.sheet}>
            {content && <A2UINodeById id={content} scope={scope} />}
          </Animated.View>
        </Animated.View>
      </RNModal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.surface.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface.card,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.xxl,
    gap: spacing.md,
  },
});
