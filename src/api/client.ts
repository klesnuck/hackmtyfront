import { getApiBaseUrl } from './baseUrl';

/**
 * The one place `fetch` is called from. Every REQ-API-* endpoint
 * (src/api/endpoints.ts) goes through this — see MOBILE_ARCHITECTURE.md §6.
 * No axios: fetch already does everything this project needs, and one fewer
 * dependency is one fewer thing that can break a build under time pressure.
 */

const DEFAULT_TIMEOUT_MS = 15_000;

function makeTraceId(): string {
  return `mobile-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public traceId: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST';
  body?: unknown;
  timeoutMs?: number;
};

export async function apiRequest<TResponse>(path: string, options: RequestOptions = {}): Promise<TResponse> {
  const { method = 'GET', body, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const traceId = makeTraceId();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${getApiBaseUrl()}/${path.replace(/^\/+/, '')}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Trace-Id': traceId,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const payload = isJson ? await response.json().catch(() => undefined) : undefined;

    if (!response.ok) {
      throw new ApiError(`${method} ${path} failed with ${response.status}`, response.status, traceId, payload);
    }

    if (__DEV__) console.log(`[api] ${method} ${path} -> ${response.status} (trace ${traceId})`);
    return payload as TResponse;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if ((err as { name?: string }).name === 'AbortError') {
      throw new ApiError(`${method} ${path} timed out after ${timeoutMs}ms`, 0, traceId);
    }
    throw new ApiError(`${method} ${path} network error: ${(err as Error).message}`, 0, traceId);
  } finally {
    clearTimeout(timeout);
  }
}
