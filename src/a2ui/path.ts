/**
 * Minimal RFC 6901 JSON Pointer support — just enough for A2UI's data-binding
 * paths ({ path: "/user/name" }) and updateDataModel's `path`. Not a general
 * JSON Pointer library; extend here if the spec's usage needs more.
 */

function unescapeToken(token: string): string {
  return token.replace(/~1/g, '/').replace(/~0/g, '~');
}

function tokenize(pointer: string): string[] {
  if (pointer === '' || pointer === '/') return [];
  const normalized = pointer.startsWith('/') ? pointer.slice(1) : pointer;
  return normalized.split('/').map(unescapeToken);
}

export function getAtPointer(root: unknown, pointer: string): unknown {
  const tokens = tokenize(pointer);
  let current: unknown = root;
  for (const token of tokens) {
    if (current == null) return undefined;
    if (Array.isArray(current)) {
      const index = Number(token);
      current = Number.isNaN(index) ? undefined : current[index];
    } else if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[token];
    } else {
      return undefined;
    }
  }
  return current;
}

/** Immutable set — returns a new root with `value` written at `pointer`. */
export function setAtPointer(root: unknown, pointer: string, value: unknown): unknown {
  const tokens = tokenize(pointer);
  if (tokens.length === 0) return value; // "/" (or "") replaces the whole root

  const clone = (node: unknown): Record<string, unknown> | unknown[] =>
    Array.isArray(node) ? [...node] : { ...(node as Record<string, unknown> | undefined) };

  const rootClone = clone(root);
  let cursor: Record<string, unknown> | unknown[] = rootClone;

  for (let i = 0; i < tokens.length - 1; i++) {
    const token = tokens[i];
    const key = Array.isArray(cursor) ? Number(token) : token;
    const existing = (cursor as Record<string, unknown>)[key as never];
    const next = clone(existing ?? {});
    (cursor as Record<string, unknown>)[key as never] = next as never;
    cursor = next;
  }

  const lastToken = tokens[tokens.length - 1];
  const lastKey = Array.isArray(cursor) ? Number(lastToken) : lastToken;
  (cursor as Record<string, unknown>)[lastKey as never] = value as never;

  return rootClone;
}

/** Per updateDataModel's spec: omitting `value` deletes the key at `path`. */
export function deleteAtPointer(root: unknown, pointer: string): unknown {
  const tokens = tokenize(pointer);
  if (tokens.length === 0) return undefined;

  const clone = (node: unknown): Record<string, unknown> | unknown[] =>
    Array.isArray(node) ? [...node] : { ...(node as Record<string, unknown> | undefined) };

  const rootClone = clone(root);
  let cursor: Record<string, unknown> | unknown[] = rootClone;

  for (let i = 0; i < tokens.length - 1; i++) {
    const token = tokens[i];
    const key = Array.isArray(cursor) ? Number(token) : token;
    const existing = (cursor as Record<string, unknown>)[key as never];
    if (existing == null) return rootClone; // path doesn't exist — nothing to delete
    const next = clone(existing);
    (cursor as Record<string, unknown>)[key as never] = next as never;
    cursor = next;
  }

  const lastToken = tokens[tokens.length - 1];
  if (Array.isArray(cursor)) {
    cursor.splice(Number(lastToken), 1);
  } else {
    delete (cursor as Record<string, unknown>)[lastToken];
  }
  return rootClone;
}
