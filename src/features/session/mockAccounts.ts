import type { SessionResponse } from '../../api/types';

/**
 * TODO(add-mock-login-accounts): remove this whole file once POST /api/session
 * (REQ-API-01) is available from the backend. See
 * openspec/changes/add-mock-login-accounts for the removal plan.
 *
 * These are NOT real credentials — SPECS.md §12 excludes an auth system, and
 * the login screen never validates input against anything real. This list
 * only exists so the app can be demoed/tested end-to-end while the backend
 * endpoint doesn't exist yet, covering every accessibility_profile shape
 * REQ-ACC-01/02 react to.
 */
type MockAccount = {
  username: string;
  password: string;
  accessibilityProfile?: SessionResponse['accessibility_profile'];
};

const MOCK_ACCOUNTS: MockAccount[] = [
  { username: 'demo', password: 'demo1234' },
  { username: 'elderly', password: 'demo1234', accessibilityProfile: { elderly: true } },
  { username: 'blind', password: 'demo1234', accessibilityProfile: { blind: true } },
  { username: 'lowliteracy', password: 'demo1234', accessibilityProfile: { low_literacy: true } },
];

function generateMockSessionId(username: string): string {
  return `mock-${username}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function resolveMockSession(username: string, password: string): SessionResponse | null {
  const normalized = username.trim().toLowerCase();
  const account = MOCK_ACCOUNTS.find(
    (candidate) => candidate.username === normalized && candidate.password === password,
  );
  if (!account) return null;

  return {
    session_id: generateMockSessionId(account.username),
    accessibility_profile: account.accessibilityProfile ?? null,
  };
}
