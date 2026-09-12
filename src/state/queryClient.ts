import { QueryClient } from '@tanstack/react-query';

/**
 * Server-state cache for anything that comes from the backend and isn't a
 * live A2UI surface (which lives in src/a2ui/store.ts instead — see
 * MOBILE_ARCHITECTURE.md §6 for why those two are kept separate: A2UI
 * surfaces are never optimistically guessed at, so they don't benefit from
 * Query's refetch/staleness machinery the way saving-bag lists etc. do).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export const queryKeys = {
  savingBags: ['saving-bags'] as const,
  savingBag: (bagId: string) => ['saving-bags', bagId] as const,
};
