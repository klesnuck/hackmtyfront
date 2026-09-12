import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet } from 'react-native';
import { useResolve } from '../../a2ui/context';
import type { A2UINodeProps } from '../../a2ui/registry';
import type { DynamicString } from '../../a2ui/types';
import { radius } from '../../theme/tokens';

/** Uses expo-video, not the deprecated expo-av (removed from Expo Go in SDK 55+). */
export function Video({ node, scope }: A2UINodeProps) {
  const resolve = useResolve(scope);
  const url = resolve(node.url as DynamicString);

  const player = useVideoPlayer(url ?? '', (p) => {
    p.loop = false;
  });

  if (!url) return null;

  return <VideoView player={player} style={styles.video} nativeControls contentFit="contain" />;
}

const styles = StyleSheet.create({
  video: { width: '100%', aspectRatio: 16 / 9, borderRadius: radius.lg, overflow: 'hidden' },
});
