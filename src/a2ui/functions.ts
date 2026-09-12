/**
 * Registry for A2UI's `{ call, args }` dynamic-value form. Keep this small —
 * it's for pure display formatting only (currency, dates). Anything that
 * looks like business logic belongs in the backend's deterministic `engine/`
 * (INV-015: the client never computes financial math either).
 */

type A2UIFunction = (args: Record<string, unknown>) => unknown;

const registry: Record<string, A2UIFunction> = {
  formatCurrencyMXN: ({ value }) => {
    const n = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(n)) return String(value ?? '');
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
  },
  formatDate: ({ value, style }) => {
    const d = typeof value === 'string' || typeof value === 'number' ? new Date(value) : null;
    if (!d || Number.isNaN(d.getTime())) return String(value ?? '');
    const dateStyle = (style as Intl.DateTimeFormatOptions['dateStyle']) ?? 'medium';
    return new Intl.DateTimeFormat('es-MX', { dateStyle }).format(d);
  },
  concat: ({ parts }) => (Array.isArray(parts) ? parts.join('') : String(parts ?? '')),
};

export function registerA2UIFunction(name: string, fn: A2UIFunction) {
  registry[name] = fn;
}

export function callA2UIFunction(name: string, args: Record<string, unknown>): unknown {
  const fn = registry[name];
  if (!fn) {
    if (__DEV__) console.warn(`[a2ui] unknown function "${name}" — returning undefined`);
    return undefined;
  }
  return fn(args);
}
