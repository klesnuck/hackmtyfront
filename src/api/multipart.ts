/**
 * Hand-rolled multipart/form-data parser for React Native.
 *
 * RN's `fetch` doesn't parse multipart responses natively. This module
 * extracts a single named JSON part from a `multipart/form-data` response,
 * skipping binary parts (e.g. inline audio). Used exclusively by the loans
 * greeting/consult endpoints (API_KNOWLEDGE.md §6).
 */

const CRLF = '\r\n';
const DOUBLE_CRLF = '\r\n\r\n';

/**
 * Extract the boundary string from a `Content-Type: multipart/form-data; boundary=...` header.
 */
function extractBoundary(contentType: string): string | null {
  const match = contentType.match(/boundary=([^\s;]+)/i);
  return match ? match[1].replace(/^"(.*)"$/, '$1') : null;
}

/**
 * Parses a multipart/form-data response and extracts the named JSON part.
 *
 * @param response - The raw `fetch` Response object.
 * @param partName - The `name` value from `Content-Disposition` to locate (e.g. `"payload"`).
 * @returns The parsed JSON value of the named part, or `null` if not found.
 */
export async function parseMultipartJsonPart<T>(response: Response, partName: string): Promise<T | null> {
  const contentType = response.headers.get('content-type') ?? '';
  const boundary = extractBoundary(contentType);

  if (!boundary) {
    // Not multipart — try plain JSON fallback (backend may omit audio part entirely).
    const text = await response.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      return null;
    }
  }

  const buffer = await response.arrayBuffer();
  const bodyText = new TextDecoder('utf-8').decode(buffer);

  const delimiter = `--${boundary}`;
  const parts = bodyText.split(delimiter);

  for (const part of parts) {
    // Skip preamble and closing boundary
    if (!part.trim() || part.trim() === '--') continue;

    const headerEndIndex = part.indexOf(DOUBLE_CRLF);
    if (headerEndIndex === -1) continue;

    const headerSection = part.substring(0, headerEndIndex);
    const body = part.substring(headerEndIndex + DOUBLE_CRLF.length);

    // Check Content-Disposition for the target part name
    const dispositionMatch = headerSection.match(
      /Content-Disposition:\s*form-data;\s*name="([^"]+)"/i,
    );
    if (!dispositionMatch || dispositionMatch[1] !== partName) continue;

    // Check that this part is JSON (skip binary audio parts)
    const isJson = headerSection.toLowerCase().includes('application/json');
    if (!isJson) continue;

    // Trim trailing CRLF that precedes the next boundary
    const trimmed = body.endsWith(CRLF) ? body.slice(0, -CRLF.length) : body;
    return JSON.parse(trimmed) as T;
  }

  return null;
}
