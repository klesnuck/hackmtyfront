import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { useResolve } from '../../a2ui/context';
import type { A2UINodeProps } from '../../a2ui/registry';
import type { DynamicString } from '../../a2ui/types';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import { scalePoints, toChartPoints } from './charting';

const HEIGHT = 160;
const PADDING = 16;

export function LineChart({ node, scope }: A2UINodeProps) {
  const resolve = useResolve(scope);
  const { width } = useWindowDimensions();
  const title = resolve(node.title as DynamicString);
  const yLabel = resolve(node.yLabel as DynamicString);
  const points = toChartPoints(resolve(node.points as DynamicString));

  if (points.length < 2) return null;
  const chartWidth = Math.max(width - spacing.xl * 2 - spacing.lg * 2, 240);
  const { path, dots } = scalePoints(points, chartWidth, HEIGHT, PADDING);

  return (
    <View style={styles.container}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View style={styles.chart}>
        <Svg width={chartWidth} height={HEIGHT}>
          <Line
            x1={PADDING}
            y1={HEIGHT - PADDING}
            x2={chartWidth - PADDING}
            y2={HEIGHT - PADDING}
            stroke={colors.border.strong}
            strokeWidth={1}
          />
          <Polyline points={path} fill="none" stroke={colors.brand.primary} strokeWidth={2.5} />
          {dots.map((dot, index) => (
            <Circle
              key={index}
              cx={dot.cx}
              cy={dot.cy}
              r={index === dots.length - 1 ? 4 : 2.5}
              fill={colors.brand.primary}
            />
          ))}
        </Svg>
      </View>
      <View style={styles.axisRow}>
        <Text style={styles.axisLabel}>{points[0].label}</Text>
        {yLabel ? <Text style={styles.axisLabel}>{yLabel}</Text> : null}
        <Text style={styles.axisLabel}>{points[points.length - 1].label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    backgroundColor: colors.surface.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.lg,
  },
  title: { ...typography.bodyStrong, color: colors.text.primary },
  chart: { alignItems: 'center' },
  axisRow: { flexDirection: 'row', justifyContent: 'space-between' },
  axisLabel: { ...typography.caption, color: colors.text.secondary },
});
