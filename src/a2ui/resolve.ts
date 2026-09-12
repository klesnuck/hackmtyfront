import { callA2UIFunction } from './functions';
import { getAtPointer } from './path';
import type { DynamicValue } from './types';

function isPathRef(v: unknown): v is { path: string } {
  return typeof v === 'object' && v !== null && 'path' in v && typeof (v as { path?: unknown }).path === 'string';
}

function isCallRef(v: unknown): v is { call: string; args?: Record<string, unknown> } {
  return typeof v === 'object' && v !== null && 'call' in v && typeof (v as { call?: unknown }).call === 'string';
}

/**
 * Resolves a DynamicValue against the surface's data model.
 * `scope` is the current item when rendering inside a template-bound ChildList
 * (the `{ object: { path, componentId } }` form) — relative paths (no leading
 * "/") resolve against it; absolute paths always resolve against `dataModel`.
 */
export function resolveDynamic<T>(
  value: DynamicValue<T> | undefined,
  dataModel: unknown,
  scope?: unknown,
): T | undefined {
  if (value === undefined) return undefined;

  if (isPathRef(value)) {
    const isAbsolute = value.path.startsWith('/');
    const base = isAbsolute || scope === undefined ? dataModel : scope;
    return getAtPointer(base, value.path) as T | undefined;
  }

  if (isCallRef(value)) {
    const resolvedArgs: Record<string, unknown> = {};
    for (const [key, argValue] of Object.entries(value.args ?? {})) {
      resolvedArgs[key] = resolveDynamic(argValue as DynamicValue<unknown>, dataModel, scope);
    }
    return callA2UIFunction(value.call, resolvedArgs) as T;
  }

  return value as T;
}
