import { create } from 'zustand';
import { deleteAtPointer, setAtPointer } from './path';
import {
  isCreateSurface,
  isDeleteSurface,
  isUpdateComponents,
  isUpdateDataModel,
  type A2UIMessage,
  type SurfaceState,
} from './types';

type A2UIStore = {
  surfaces: Record<string, SurfaceState>;
  /** Applies an a2ui[] message array in order. Safe to call with messages for any surface. */
  applyMessages: (messages: A2UIMessage[]) => void;
  removeSurface: (surfaceId: string) => void;
};

/**
 * The client-side projection of every surface the backend has sent this
 * session. One store for the whole app (not one per screen) because a
 * surface created for one screen may be referenced again later (e.g. the
 * Kill Test replays a real surface — MOBILE_ARCHITECTURE.md §8).
 */
export const useA2UIStore = create<A2UIStore>((set) => ({
  surfaces: {},

  applyMessages: (messages) =>
    set((state) => {
      const surfaces = { ...state.surfaces };

      for (const message of messages) {
        if (isCreateSurface(message)) {
          const { surfaceId, catalogId } = message.createSurface;
          surfaces[surfaceId] = { surfaceId, catalogId, components: {}, dataModel: {} };
          continue;
        }

        if (isUpdateComponents(message)) {
          const { surfaceId, components } = message.updateComponents;
          const surface = surfaces[surfaceId];
          if (!surface) {
            if (__DEV__) console.warn(`[a2ui] updateComponents for unknown surface "${surfaceId}"`);
            continue;
          }
          const nextComponents = { ...surface.components };
          for (const component of components) nextComponents[component.id] = component;
          surfaces[surfaceId] = { ...surface, components: nextComponents };
          continue;
        }

        if (isUpdateDataModel(message)) {
          const { surfaceId, path, value } = message.updateDataModel;
          const surface = surfaces[surfaceId];
          if (!surface) {
            if (__DEV__) console.warn(`[a2ui] updateDataModel for unknown surface "${surfaceId}"`);
            continue;
          }
          const pointer = path ?? '/';
          const nextDataModel =
            'value' in message.updateDataModel
              ? setAtPointer(surface.dataModel, pointer, value)
              : deleteAtPointer(surface.dataModel, pointer);
          surfaces[surfaceId] = { ...surface, dataModel: nextDataModel };
          continue;
        }

        if (isDeleteSurface(message)) {
          delete surfaces[message.deleteSurface.surfaceId];
          continue;
        }
      }

      return { surfaces };
    }),

  removeSurface: (surfaceId) =>
    set((state) => {
      const surfaces = { ...state.surfaces };
      delete surfaces[surfaceId];
      return { surfaces };
    }),
}));

export function useSurface(surfaceId: string | undefined): SurfaceState | undefined {
  return useA2UIStore((s) => (surfaceId ? s.surfaces[surfaceId] : undefined));
}
