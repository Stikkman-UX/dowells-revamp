import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getMeServer } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/error";
import { AdminShell } from "@/components/admin/layout/AdminShell";
import { AccessDenied } from "@/components/admin/layout/AccessDenied";
import { ApiUnavailable } from "@/components/admin/layout/ApiUnavailable";

/**
 * REAL auth check for every /admin/(panel)/* route (proxy.ts only checks
 * cookie presence). Redirects to login on 401/403, shows an access-denied
 * screen for a non-Admin user, and a clear unavailable state if the backend
 * cannot be reached at all — never crashes the panel.
 */
export default async function PanelLayout({ children }: { children: ReactNode }) {
  let user;
  try {
    ({ user } = await getMeServer());
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      redirect("/admin/login?next=%2Fadmin");
    }
    return <ApiUnavailable />;
  }

  if (user.userType !== "Admin") {
    return <AccessDenied user={user} />;
  }

  return <AdminShell user={user}>{children}</AdminShell>;
}
