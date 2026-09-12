import { useMutation } from '@tanstack/react-query';
import { login } from '../../api/endpoints';
import { useSessionStore } from '../../state/session.store';

/**
 * Real credential verification — POST /api/login (amitie/backend, SPECS.md
 * §12). The backend checks the password hash and returns 401 on a bad
 * username/password; it also returns the account's real accessibility mode
 * in the same response, so REQ-ACC-01/02 activates from one round trip
 * instead of a second `GET /api/profile` call.
 */
export function useLogin() {
  const setSession = useSessionStore((s) => s.setSession);

  return useMutation({
    mutationFn: (credentials: { username: string; password: string }) => login(credentials),
    onSuccess: async (response) => {
      await setSession(
        { session_id: response.session_id, user_id: response.user_id },
        response.accessibility_mode,
      );
    },
  });
}
