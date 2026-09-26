import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const API_INTERNAL_URL =
  process.env.API_INTERNAL_URL ?? "http://localhost:8000";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Optimistic auth gate for /admin/*. This only checks cookie *presence* —
 * it never verifies the JWT. Real verification happens on the backend for
 * every admin API call. If an accessToken is missing but a refreshToken is
 * present, we attempt a single silent refresh so a page load right after
 * accessToken expiry doesn't bounce the admin to /login unnecessarily.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  if (pathname === "/admin/login") {
    if (accessToken) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (accessToken) {
    return NextResponse.next();
  }

  if (refreshToken) {
    const refreshed = await tryRefresh(request);
    if (refreshed) {
      return refreshed;
    }
  }

  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

async function tryRefresh(request: NextRequest) {
  try {
    const res = await fetch(`${API_INTERNAL_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: {
        cookie: request.headers.get("cookie") ?? "",
        Origin: SITE_URL,
        "X-Requested-With": "XMLHttpRequest",
      },
    });

    if (!res.ok) {
      return null;
    }

    const setCookies = res.headers.getSetCookie();
    if (setCookies.length === 0) {
      return null;
    }

    // Make the refreshed accessToken visible to this same request's Server
    // Components by forwarding it on the outgoing request's cookie header.
    const requestHeaders = new Headers(request.headers);
    const existingPairs = (requestHeaders.get("cookie") ?? "")
      .split(";")
      .map((pair) => pair.trim())
      .filter(Boolean);
    const newPairs = setCookies.map((cookie) => cookie.split(";")[0].trim());
    requestHeaders.set("cookie", [...existingPairs, ...newPairs].join("; "));

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });

    // Also copy the Set-Cookie(s) onto the outgoing response so the browser
    // stores the refreshed accessToken.
    for (const cookie of setCookies) {
      response.headers.append("set-cookie", cookie);
    }

    return response;
  } catch {
    return null;
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
