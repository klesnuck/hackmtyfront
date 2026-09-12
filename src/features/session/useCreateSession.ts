import { useMutation } from '@tanstack/react-query';
import { createSession } from '../../api/endpoints';
import { useSessionStore } from '../../state/session.store';

/**
 * REQ-API-01 (POST /api/session). This is NOT authentication — SPECS.md §12
 * excludes auth systems entirely. It mints a mocked demo session_id and, if
 * the account has one, an accessibility profile that drives REQ-ACC-01/02.
 * The login screen's fields are a visual gate only; nothing is verified.
 */
export function useCreateSession() {
  const setSession = useSessionStore((s) => s.setSession);

  return useMutation({
    mutationFn: createSession,
    onSuccess: async (session) => {
      await setSession(session);
    },
  });
}
