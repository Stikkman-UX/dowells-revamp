import { ApiError, parseErrorEnvelope } from "./error";

const API_BASE = "/api/v1";

export type BrowserFetchInit = Omit<RequestInit, "body" | "credentials"> & {
  body?: unknown | FormData;
};

let refreshInFlight: Promise<boolean> | null = null;

function isFormData(body: unknown): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

function buildInit(init?: BrowserFetchInit): RequestInit {
  const headers = new Headers(init?.headers);
  headers.set("X-Requested-With", "XMLHttpRequest");

  let body: BodyInit | undefined;
  if (init?.body !== undefined) {
    if (isFormData(init.body)) {
      body = init.body;
      // Let the browser set the multipart boundary itself.
      headers.delete("Content-Type");
    } else {
      body = JSON.stringify(init.body);
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
    }
  }

  return {
    ...init,
    body,
    headers,
    credentials: "same-origin",
  };
}

async function refreshOnce(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "X-Requested-With": "XMLHttpRequest" },
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

function redirectToLogin() {
  if (typeof window !== "undefined") {
    const next = window.location.pathname + window.location.search;
    // A full navigation (not router.push) so the client Router Cache is
    // dropped along with the stale session.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- deliberate full reload, not a router transition
    window.location.href = `/admin/login?next=${encodeURIComponent(next)}`;
  }
}

/**
 * The only fetch client allowed for browser-side CMS/admin calls (see
 * CLAUDE.md "centralized service layers"). Always relative to `/api/v1`,
 * so requests stay same-origin and cookies are host-only. On a 401, it
 * performs exactly one silent refresh + one retry before giving up and
 * redirecting to `/admin/login`.
 */
export async function browserApiFetch<T>(
  path: string,
  init?: BrowserFetchInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, buildInit(init));

  // A 401 from an auth endpoint is an answer (e.g. wrong password), not an
  // expired session — surface it instead of refreshing and reloading the page.
  if (res.status === 401 && !path.startsWith("/auth/")) {
    const refreshed = await refreshOnce();
    if (refreshed) {
      const retryRes = await fetch(`${API_BASE}${path}`, buildInit(init));
      if (retryRes.ok) {
        return parseSuccess<T>(retryRes);
      }
      if (retryRes.status !== 401) {
        throw await parseErrorEnvelope(retryRes);
      }
    }
    redirectToLogin();
    throw new ApiError(401, "Not authenticated");
  }

  if (!res.ok) {
    throw await parseErrorEnvelope(res);
  }

  return parseSuccess<T>(res);
}

async function parseSuccess<T>(res: Response): Promise<T> {
  if (res.status === 204) {
    return undefined as T;
  }
  const body = (await res.json()) as { data?: T };
  return body.data as T;
}
