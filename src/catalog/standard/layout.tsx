import { StyleSheet, View, type FlexAlignType, type ViewStyle } from 'react-native';
import type { A2UINodeProps } from '../../a2ui/registry';
import { colors, spacing } from '../../theme/tokens';

type Justify = 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
type Align = 'start' | 'center' | 'end' | 'stretch';

const JUSTIFY_MAP: Record<Justify, ViewStyle['justifyContent']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  'space-between': 'space-between',
  'space-around': 'space-around',
  'space-evenly': 'space-evenly',
};

const ALIGN_MAP: Record<Align, FlexAlignType> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
};

function flexProps(node: A2UINodeProps['node']) {
  const justify = (node.justify as Justify | undefined) ?? 'start';
  const align = (node.align as Align | undefined) ?? 'stretch';
  return {
    justifyContent: JUSTIFY_MAP[justify] ?? 'flex-start',
    alignItems: ALIGN_MAP[align] ?? 'stretch',
  } satisfies ViewStyle;
}

export function Row({ node, children }: A2UINodeProps) {
  return <View style={[{ flexDirection: 'row', gap: spacing.sm }, flexProps(node)]}>{children}</View>;
}

export function Column({ node, children }: A2UINodeProps) {
  return <View style={[{ flexDirection: 'column', gap: spacing.sm }, flexProps(node)]}>{children}</View>;
}

export function List({ node, children }: A2UINodeProps) {
  const direction = (node.direction as 'vertical' | 'horizontal' | undefined) ?? 'vertical';
  return (
    <View
      style={[
        { flexDirection: direction === 'horizontal' ? 'row' : 'column', gap: spacing.sm },
        flexProps(node),
      ]}
    >
      {children}
    </View>
  );
}

export function Divider({ node }: A2UINodeProps) {
  const axis = (node.axis as 'horizontal' | 'vertical' | undefined) ?? 'horizontal';
  return (
    <View
      style={
        axis === 'vertical'
          ? { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: colors.border.subtle }
          : { height: StyleSheet.hairlineWidth, width: '100%', backgroundColor: colors.border.subtle }
      }
    />
  );
}
