import { sendAction } from '../api/endpoints';
import { resolveDynamic } from './resolve';
import { useA2UIStore } from './store';
import type { A2UIComponent, ComponentId } from './types';

/**
 * The ONLY path a catalog component may use to talk to the backend
 * (MOBILE_ARCHITECTURE.md §4, rule 2). A component never calls `sendAction`
 * itself — it calls `dispatchA2UIAction(node, extraContext)`, which reads the
 * component's own `action.event` definition, resolves any data bindings in
 * its context, and replaces the surface wholesale with whatever comes back.
 */
export async function dispatchA2UIAction(
  surfaceId: string,
  sourceComponentId: ComponentId,
  node: A2UIComponent,
  dataModel: unknown,
  scope?: unknown,
  extraContext?: Record<string, unknown>,
  onLoanRequest?: (resolvedContext: Record<string, unknown>) => void,
) {
  const eventDef = node.action?.event;
  if (!eventDef) return; // node has no server-bound action (may be a local functionCall instead)

  const resolvedContext: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(eventDef.context ?? {})) {
    resolvedContext[key] = resolveDynamic(value, dataModel, scope);
  }

  // Routing exception: request_loan (emitted by LoanOffer) is client-routed (API_KNOWLEDGE.md §3)
  if (eventDef.name === 'request_loan') {
    if (onLoanRequest) {
      onLoanRequest({ ...resolvedContext, ...extraContext });
    } else if (__DEV__) {
      console.warn('[actionBus] request_loan action dispatched without onLoanRequest handler');
    }
    return;
  }

  const response = await sendAction({
    surface_id: surfaceId,
    name: eventDef.name,
    source_component_id: sourceComponentId,
    context: { ...resolvedContext, ...extraContext },
  });

  useA2UIStore.getState().applyMessages(response.a2ui);
}

