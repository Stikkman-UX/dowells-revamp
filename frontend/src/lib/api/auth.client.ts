import type { User } from "@/types/cms";
import { browserApiFetch } from "./browser";

// Client Components only (login form, admin top bar). Server code uses `./auth`.
export function loginBrowser(email: string, password: string) {
  return browserApiFetch<{ user: User }>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function logoutBrowser() {
  return browserApiFetch<undefined>("/auth/logout", { method: "POST" });
}
