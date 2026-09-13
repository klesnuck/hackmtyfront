import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { useResolve } from '../../a2ui/context';
import type { A2UINodeProps } from '../../a2ui/registry';
import type { DynamicString } from '../../a2ui/types';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import { scaleSeries, toChartPoints } from './charting';

const HEIGHT = 170;
const PADDING = 16;

export function ForecastChart({ node, scope }: A2UINodeProps) {
  const resolve = useResolve(scope);
  const { width } = useWindowDimensions();
  const title = resolve(node.title as DynamicString);
  const forecast = toChartPoints(resolve(node.forecast as DynamicString));
  const actual = toChartPoints(resolve(node.actual as DynamicString));

  if (forecast.length < 2 && actual.length < 2) return null;

  const series = [forecast, actual].filter((points) => points.length > 1);
  const chartWidth = Math.max(width - spacing.xl * 2 - spacing.lg * 2, 240);
  const { paths, dots } = scaleSeries(series, chartWidth, HEIGHT, PADDING);

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
          {paths.map((path, index) => (
            <Polyline
              key={`line-${index}`}
              points={path}
              fill="none"
              stroke={index === 0 ? colors.brand.primary : colors.text.secondary}
              strokeWidth={2.5}
              strokeDasharray={index === 0 ? undefined : '5 4'}
            />
          ))}
          {dots.map((seriesDots, seriesIndex) =>
            seriesDots.map((dot, index) => (
              <Circle
                key={`dot-${seriesIndex}-${index}`}
                cx={dot.cx}
                cy={dot.cy}
                r={2.5}
                fill={seriesIndex === 0 ? colors.brand.primary : colors.text.secondary}
              />
            )),
          )}
        </Svg>
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: colors.brand.primary }]} />
          <Text style={styles.legendText}>Pronóstico</Text>
        </View>
        {actual.length > 1 ? (
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: colors.text.secondary }]} />
            <Text style={styles.legendText}>Real</Text>
          </View>
        ) : null}
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
  legend: { flexDirection: 'row', gap: spacing.lg },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendSwatch: { width: 12, height: 3, borderRadius: 2 },
  legendText: { ...typography.caption, color: colors.text.secondary },
});
