import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useResolve } from '../../a2ui/context';
import type { A2UINodeProps } from '../../a2ui/registry';
import type { DynamicString } from '../../a2ui/types';
import { colors } from '../../theme/tokens';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

/**
 * A2UI's Icon component takes a `name` from a "predefined set" the spec
 * doesn't enumerate exactly — this maps our own small vocabulary to Ionicons
 * glyphs. Extend this map as the backend team sends new icon names; unknown
 * names fall back to a visible placeholder glyph instead of crashing.
 */
const ICON_MAP: Record<string, IoniconName> = {
  check: 'checkmark',
  'check-circle': 'checkmark-circle',
  close: 'close',
  warning: 'warning',
  alert: 'alert-circle',
  info: 'information-circle',
  back: 'chevron-back',
  forward: 'chevron-forward',
  down: 'chevron-down',
  up: 'chevron-up',
  eye: 'eye-outline',
  'eye-off': 'eye-off-outline',
  mic: 'mic',
  'mic-off': 'mic-off',
  wallet: 'wallet-outline',
  card: 'card-outline',
  home: 'home-outline',
  chat: 'chatbubble-ellipses-outline',
  lock: 'lock-closed-outline',
  fingerprint: 'finger-print-outline',
  calendar: 'calendar-outline',
  trending: 'trending-up-outline',
  savings: 'save-outline',
};

export function Icon({ node, scope }: A2UINodeProps) {
  const resolve = useResolve(scope);
  const name = resolve(node.name as DynamicString) ?? '';
  const size = typeof node.size === 'number' ? node.size : 24;
  const color = typeof node.color === 'string' ? node.color : colors.text.primary;

  return <Ionicons name={ICON_MAP[name] ?? 'help-circle-outline'} size={size} color={color} />;
}
