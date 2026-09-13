import Constants from 'expo-constants';

const FALLBACK_BASE_URL = 'http://localhost:8000';

/**
 * The single source of truth for the backend origin.
 *
 * Always returns the origin with **all** trailing slashes removed, so callers
 * can safely concatenate a leading-slash path (`/api/...`) without ever
 * producing `host//api/...` — which the tunnel/edge answers with 404 and which
 * the backend never even logs. Configured via `EXPO_PUBLIC_API_BASE_URL`
 * (baked into `extra.apiBaseUrl` at build time); a tunnel origin is expected,
 * with or without a trailing slash.
 */
export function getApiBaseUrl(): string {
  const fromConfig = Constants.expoConfig?.extra?.apiBaseUrl;
  const raw =
    typeof fromConfig === 'string' && fromConfig.trim().length > 0
      ? fromConfig.trim()
      : FALLBACK_BASE_URL;
  return raw.replace(/\/+$/, '');
}
