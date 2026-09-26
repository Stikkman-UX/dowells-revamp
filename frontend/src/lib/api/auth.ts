import "server-only";
import type { User } from "@/types/cms";
import { serverApiFetch } from "./server";

// Server Components only (admin layout auth check). Client Components use
// `./auth.client` — mixing both in one module would drag `next/headers` into
// the client bundle.
export function getMeServer() {
  return serverApiFetch<{ user: User }>("/auth/me");
}

// Note: `/auth/refresh` is intentionally not exposed here. `src/proxy.ts`
// performs its own raw fetch (it needs direct access to the Set-Cookie
// header), and `src/lib/api/browser.ts` performs the browser-side
// single-refresh-then-retry internally on a 401.
