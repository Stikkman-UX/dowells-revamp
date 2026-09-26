import "server-only";
import { cookies } from "next/headers";
import { ApiError, parseErrorEnvelope } from "./error";

const API_INTERNAL_URL =
  process.env.API_INTERNAL_URL ?? "http://localhost:8000";
const API_BASE = `${API_INTERNAL_URL}/api/v1`;

/**
 * For public, unauthenticated reads from Server Components (e.g. rendering
 * a CMS page). Never throws — any failure (network error, timeout, non-2xx
 * status, bad JSON) resolves to `null` so public pages can always fall back
 * to their built-in defaults per-section (see Rule 5 / API_CONTRACT §5).
 */
export async function serverPublicFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) {
      return null;
    }

    const body = (await res.json()) as { data?: T };
    return body.data ?? null;
  } catch {
    return null;
  }
}

/**
 * Like `serverPublicFetch`, but for callers that need to tell a 404 (e.g.
 * "product not found" -> `notFound()`) apart from an outage (e.g. -> throw to
 * `error.tsx`) instead of collapsing every failure to `null`. `status: 0`
 * means the request itself failed (network error/timeout), never a real
 * HTTP status.
 */
export async function serverPublicFetchDetailed<T>(
  path: string
): Promise<{ status: number; data: T | null }> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) {
      return { status: res.status, data: null };
    }

    const body = (await res.json()) as { data?: T };
    return { status: res.status, data: body.data ?? null };
  } catch {
    return { status: 0, data: null };
  }
}

/**
 * For authenticated reads from Server Components (admin pages). Forwards
 * the incoming request's cookies so the backend can authenticate the
 * Admin user. Throws a typed `ApiError` on any non-2xx response instead of
 * silently falling back — admin screens should surface failures.
 */
export async function serverApiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const cookieStore = await cookies();

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      ...(init?.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...init?.headers,
      cookie: cookieStore.toString(),
    },
  });

  if (!res.ok) {
    throw await parseErrorEnvelope(res);
  }

  const body = (await res.json()) as { data?: T };
  return body.data as T;
}

export { ApiError };
