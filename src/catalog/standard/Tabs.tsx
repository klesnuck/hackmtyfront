import { useState } from 'react';
import { StyleSheet, Text as RNText, View } from 'react-native';
import { useResolve } from '../../a2ui/context';
import { A2UINodeById } from '../../a2ui/renderer';
import type { A2UINodeProps } from '../../a2ui/registry';
import type { ComponentId, DynamicString } from '../../a2ui/types';
import { colors, spacing, typography } from '../../theme/tokens';
import { AnimatedPressable } from '../shared/AnimatedPressable';

type TabDef = { title: DynamicString; child: ComponentId };

export function Tabs({ node, scope }: A2UINodeProps) {
  const resolve = useResolve(scope);
  const tabs = (Array.isArray(node.tabs) ? node.tabs : []) as TabDef[];
  const [activeIndex, setActiveIndex] = useState(0);
  const active = tabs[activeIndex];

  return (
    <View style={styles.wrapper}>
      <View style={styles.tabBar}>
        {tabs.map((tab, index) => (
          <AnimatedPressable
            key={index}
            onPress={() => setActiveIndex(index)}
            style={[styles.tab, index === activeIndex && styles.tabActive]}
          >
            <RNText style={[styles.tabLabel, index === activeIndex && styles.tabLabelActive]}>
              {resolve(tab.title) ?? ''}
            </RNText>
          </AnimatedPressable>
        ))}
      </View>
      {active && <A2UINodeById id={active.child} scope={scope} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.md },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
  tab: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.brand.primary },
  tabLabel: { ...typography.bodyStrong, color: colors.text.secondary },
  tabLabelActive: { color: colors.brand.primary },
});
