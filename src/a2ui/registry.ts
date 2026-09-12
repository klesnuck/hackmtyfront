import type { ComponentType, ReactNode } from 'react';
import type { A2UIComponent } from './types';

export type A2UINodeProps = {
  node: A2UIComponent;
  /** The data-model item this node should read relative paths against (list templates). */
  scope?: unknown;
  /** Already-rendered children (resolved by the renderer from `node.children`/`node.child`). */
  children?: ReactNode;
};

/**
 * The A2UI "basic" reference catalog's vocabulary (https://a2ui.org, basic/catalog.json),
 * plus room for our own product-specific extensions (La Mesa / El Revés / Saving Bags
 * components — add them here as they're designed with the backend team).
 *
 * This is a closed union on purpose: `CatalogRegistry` below requires every one of these
 * keys, so a catalog module that forgets one fails to typecheck instead of failing silently
 * in front of a judge. See MOBILE_ARCHITECTURE.md §5/§6 and REQ-ACC-02.
 */
export type BasicNodeType =
  | 'Text'
  | 'Image'
  | 'Icon'
  | 'Video'
  | 'AudioPlayer'
  | 'Row'
  | 'Column'
  | 'List'
  | 'Card'
  | 'Tabs'
  | 'Modal'
  | 'Divider'
  | 'Button'
  | 'TextField'
  | 'CheckBox'
  | 'ChoicePicker'
  | 'Slider'
  | 'DateTimeInput';

export type CatalogRegistry = Record<BasicNodeType, ComponentType<A2UINodeProps>>;

export type CatalogId = 'standard' | 'voz-color';

const catalogs: Partial<Record<CatalogId, CatalogRegistry>> = {};

/**
 * The only place component types get registered. `catalog/standard/index.ts`
 * and `catalog/voz-color/index.ts` each call this once at module load with
 * their full component map — see MOBILE_ARCHITECTURE.md §4. TypeScript
 * enforces both pass a *complete* `CatalogRegistry` (every `BasicNodeType`
 * key) — a catalog missing a component type is a build error, not a runtime
 * surprise during the accessible-persona demo.
 */
export function registerCatalog(catalogId: CatalogId, registry: CatalogRegistry) {
  catalogs[catalogId] = registry;
}

export function getCatalog(catalogId: CatalogId): CatalogRegistry {
  const registry = catalogs[catalogId] ?? catalogs.standard;
  if (!registry) {
    throw new Error(
      `[a2ui] no catalog registered yet for "${catalogId}" (and no "standard" fallback). ` +
        'Make sure catalog/standard/index.ts has run its registerCatalog() call before rendering.',
    );
  }
  return registry;
}
