import { useMutation } from '@tanstack/react-query';
import type { SessionResponse } from '../../api/types';
import { useSessionStore } from '../../state/session.store';
import { resolveMockSession } from './mockAccounts';

/**
 * REQ-API-01 (POST /api/session). This is NOT authentication — SPECS.md §12
 * excludes auth systems entirely. It mints a mocked demo session_id and, if
 * the account has one, an accessibility profile that drives REQ-ACC-01/02.
 * The login screen's fields are a visual gate only; nothing is verified.
 *
 * TODO(add-mock-login-accounts): POST /api/session isn't deployed yet, so
 * this resolves sessions from a fixed local mock account list instead of
 * calling `createSession()` (src/api/endpoints.ts, left untouched). Once the
 * backend confirms the endpoint is live, replace the body below with
 * `createSession()` and delete src/features/session/mockAccounts.ts. See
 * openspec/changes/add-mock-login-accounts.
 */
export function useCreateSession() {
  const setSession = useSessionStore((s) => s.setSession);

  return useMutation({
    mutationFn: async (credentials: { username: string; password: string }): Promise<SessionResponse> => {
      const mockSession = resolveMockSession(credentials.username, credentials.password);
      if (!mockSession) throw new Error('No matching mock account');
      return mockSession;
    },
    onSuccess: async (session) => {
      await setSession(session);
    },
  });
}
