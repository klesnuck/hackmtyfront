/**
 * TypeScript mirror of the A2UI v0.9.1 protocol (https://a2ui.org/specification/v0.9.1-a2ui/).
 * Transcribed from the spec, not invented — per AGENTS.md §7 ("never guess an API/message
 * shape"). If the backend's `a2ui-agent-sdk` version ever diverges from v0.9.1, update this
 * file first and treat every other file in `src/a2ui/` as downstream of it.
 *
 * Casing note: A2UI's own envelope fields are camelCase (surfaceId, sourceComponentId, ...).
 * This is intentionally DIFFERENT from `src/api/types.ts`, whose REST wire types are snake_case
 * to match the backend's frozen contract (SPECS.md §8, a Python/FastAPI/Pydantic API). Do not
 * "fix" one to match the other — `src/api/endpoints.ts` is the single place that bridges them.
 */

export type A2UIVersion = 'v0.9.1';

export type ComponentId = string;

/** A value that is either a literal, a JSON-Pointer data binding, or a function call. */
export type DynamicValue<T> =
  | T
  | { path: string }
  | { call: string; args?: Record<string, DynamicValue<unknown>> };

export type DynamicString = DynamicValue<string>;
export type DynamicNumber = DynamicValue<number>;
export type DynamicBoolean = DynamicValue<boolean>;

export type ChildList =
  | ComponentId[]
  | { array: ComponentId[] }
  | { object: { path: string; componentId: ComponentId } };

export type ComponentAction = {
  /** Sent to the backend's a2ui_action / REQ-API-03 as { name, context }. */
  event?: { name: string; context?: Record<string, DynamicValue<unknown>> };
  /** Handled entirely on-device (e.g. openUrl) — never reaches the backend. */
  functionCall?: { call: string; args?: Record<string, DynamicValue<unknown>> };
};

/**
 * A single node in the flat component list. `component` is the catalog type name
 * (e.g. "Text", "Column", "BreakAlert") — see src/a2ui/registry.ts for how that
 * string resolves to an actual React component. Everything beyond the known
 * structural fields is a component-specific prop (text, value, variant, ...),
 * hence the index signature.
 */
export type A2UIComponent = {
  id: ComponentId;
  component: string;
  children?: ChildList;
  child?: ComponentId;
  action?: ComponentAction;
  [prop: string]: unknown;
};

export type CreateSurfaceMessage = {
  version: A2UIVersion;
  createSurface: {
    surfaceId: string;
    catalogId: string;
    theme?: Record<string, unknown>;
    sendDataModel?: boolean;
  };
};

export type UpdateComponentsMessage = {
  version: A2UIVersion;
  updateComponents: {
    surfaceId: string;
    components: A2UIComponent[];
  };
};

export type UpdateDataModelMessage = {
  version: A2UIVersion;
  updateDataModel: {
    surfaceId: string;
    /** JSON Pointer; defaults to "/" (replace the whole data model). */
    path?: string;
    /** Omit to delete the key at `path`. */
    value?: unknown;
  };
};

export type DeleteSurfaceMessage = {
  version: A2UIVersion;
  deleteSurface: { surfaceId: string };
};

export type A2UIMessage =
  | CreateSurfaceMessage
  | UpdateComponentsMessage
  | UpdateDataModelMessage
  | DeleteSurfaceMessage;

/** What the client sends back when a user interacts with a component's `action.event`. */
export type A2UIActionMessage = {
  name: string;
  surfaceId: string;
  sourceComponentId: ComponentId;
  timestamp: string;
  context: Record<string, unknown>;
};

/** Per-surface client-side state the store maintains — not part of the wire protocol itself. */
export type SurfaceState = {
  surfaceId: string;
  catalogId: string;
  components: Record<ComponentId, A2UIComponent>;
  dataModel: unknown;
};

export function isCreateSurface(m: A2UIMessage): m is CreateSurfaceMessage {
  return 'createSurface' in m;
}
export function isUpdateComponents(m: A2UIMessage): m is UpdateComponentsMessage {
  return 'updateComponents' in m;
}
export function isUpdateDataModel(m: A2UIMessage): m is UpdateDataModelMessage {
  return 'updateDataModel' in m;
}
export function isDeleteSurface(m: A2UIMessage): m is DeleteSurfaceMessage {
  return 'deleteSurface' in m;
}
