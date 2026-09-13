/**
 * Shared helpers for the chart-like catalog components (`LineChart`,
 * `ForecastChart`). The backend's canonical item shapes are documented in
 * `API_KNOWLEDGE.md` §6, but model output has been observed with several key
 * spellings, so these helpers accept all known variants.
 */

export type ChartPoint = { x: number; y: number; label?: string };

function firstNumber(source: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const raw = source[key];
    if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
    if (typeof raw === 'string' && raw.trim() !== '' && Number.isFinite(Number(raw))) {
      return Number(raw);
    }
  }
  return null;
}

function firstLabel(source: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const raw = source[key];
    if (typeof raw === 'string' && raw.trim() !== '') return raw;
  }
  return undefined;
}

export function toChartPoints(raw: unknown): ChartPoint[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => {
    const source = (item ?? {}) as Record<string, unknown>;
    const x = firstNumber(source, ['x', 'month', 'period']) ?? index;
    const label = firstLabel(source, ['label', 'period', 'month', 'x']);
    const y =
      firstNumber(source, ['y', 'value', 'balance', 'saldo', 'totalBalance', 'amount']) ?? 0;
    return { x, y, label: label ?? String(x) };
  });
}

export function scalePoints(
  points: ChartPoint[],
  width: number,
  height: number,
  padding: number,
): { path: string; dots: { cx: number; cy: number }[] } {
  if (points.length === 0) return { path: '', dots: [] };
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys, 0);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  const dots = points.map((point) => ({
    cx: padding + ((point.x - minX) / spanX) * innerW,
    cy: padding + innerH - ((point.y - minY) / spanY) * innerH,
  }));
  return { path: dots.map((dot) => `${dot.cx.toFixed(1)},${dot.cy.toFixed(1)}`).join(' '), dots };
}

export function scaleSeries(
  seriesList: ChartPoint[][],
  width: number,
  height: number,
  padding: number,
): { paths: string[]; dots: { cx: number; cy: number }[][] } {
  const all = seriesList.flat();
  if (all.length === 0) return { paths: seriesList.map(() => ''), dots: seriesList.map(() => []) };
  const xs = all.map((point) => point.x);
  const ys = all.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys, 0);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const dots = seriesList.map((series) =>
    series.map((point) => ({
      cx: padding + ((point.x - minX) / spanX) * innerW,
      cy: padding + innerH - ((point.y - minY) / spanY) * innerH,
    })),
  );
  const paths = dots.map((series) =>
    series.map((dot) => `${dot.cx.toFixed(1)},${dot.cy.toFixed(1)}`).join(' '),
  );
  return { paths, dots };
}
