/**
 * Path utilities shared by SectionForm and every field component.
 *
 * `path` is a dotted string with numeric indexes for array items — the SAME
 * format the API returns in `errors[].path`, minus the leading `data.`
 * (e.g. `carousel.2.media`). `setIn`/`getIn` walk that same format so a
 * server error path can be used directly as a lookup key and, one segment
 * at a time, as a relative path for immutable updates at any nesting depth.
 */

export function getIn(obj: unknown, path: string): unknown {
  if (!path) return obj;
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc === null || acc === undefined) return undefined;
    return (acc as Record<string, unknown>)[key];
  }, obj);
}

export function setIn<T>(obj: T, path: string, value: unknown): T {
  return setKeys(obj, path.split("."), value) as T;
}

function setKeys(obj: unknown, keys: string[], value: unknown): unknown {
  const [key, ...rest] = keys;
  const isIndex = /^\d+$/.test(key);

  if (rest.length === 0) {
    if (isIndex) {
      const arr = Array.isArray(obj) ? obj.slice() : [];
      arr[Number(key)] = value;
      return arr;
    }
    const base = obj && typeof obj === "object" ? (obj as Record<string, unknown>) : {};
    return { ...base, [key]: value };
  }

  if (isIndex) {
    const arr = Array.isArray(obj) ? obj.slice() : [];
    const idx = Number(key);
    arr[idx] = setKeys(arr[idx], rest, value);
    return arr;
  }

  const base = obj && typeof obj === "object" ? (obj as Record<string, unknown>) : {};
  return { ...base, [key]: setKeys(base[key], rest, value) };
}

/** True when `errors` has an entry at exactly `prefix` or anywhere below it. */
export function hasErrorUnder(errors: Record<string, string>, prefix: string): boolean {
  const nested = `${prefix}.`;
  return Object.keys(errors).some((k) => k === prefix || k.startsWith(nested));
}

export function fieldDomId(path: string): string {
  return `field-${path}`;
}
