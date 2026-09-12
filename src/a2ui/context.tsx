import { createContext, useCallback, useContext, type ReactNode } from 'react';
import { dispatchA2UIAction } from './actionBus';
import { resolveDynamic } from './resolve';
import type { CatalogId } from './registry';
import type { A2UIComponent, ComponentId, DynamicValue } from './types';

type A2UISurfaceContextValue = {
  surfaceId: string;
  catalogId: CatalogId;
  dataModel: unknown;
  components: Record<ComponentId, A2UIComponent>;
};

const A2UISurfaceContext = createContext<A2UISurfaceContextValue | null>(null);

export function A2UISurfaceProvider({
  value,
  children,
}: {
  value: A2UISurfaceContextValue;
  children: ReactNode;
}) {
  return <A2UISurfaceContext.Provider value={value}>{children}</A2UISurfaceContext.Provider>;
}

export function useA2UISurfaceContext(): A2UISurfaceContextValue {
  const ctx = useContext(A2UISurfaceContext);
  if (!ctx) {
    throw new Error('[a2ui] catalog component rendered outside <A2UISurface> — no surface context available');
  }
  return ctx;
}

/**
 * Every catalog component uses this to turn a DynamicValue prop into a plain
 * value: `const label = useResolve(scope)(node.label as DynamicString);`
 */
export function useResolve(scope?: unknown) {
  const { dataModel } = useA2UISurfaceContext();
  return useCallback(
    <T,>(value: DynamicValue<T> | undefined) => resolveDynamic(value, dataModel, scope),
    [dataModel, scope],
  );
}

/**
 * Every interactive catalog component (Button, ChoicePicker, ...) uses this
 * to fire its `action.event` back to the agent — the only path to the network.
 */
export function useDispatchAction(node: A2UIComponent, scope?: unknown) {
  const { surfaceId, dataModel } = useA2UISurfaceContext();
  return useCallback(
    (extraContext?: Record<string, unknown>) =>
      dispatchA2UIAction(surfaceId, node.id, node, dataModel, scope, extraContext),
    [surfaceId, node, dataModel, scope],
  );
}

export function useSurfaceId(): string {
  return useA2UISurfaceContext().surfaceId;
}
