import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: { template: "%s · Dowell's CMS", default: "Dowell's CMS" },
  robots: { index: false, follow: false },
};

/**
 * Minimal wrapper shared by both the (auth) and (panel) route groups. Real
 * auth enforcement lives in (panel)/layout.tsx and in proxy.ts — this file
 * must stay auth-agnostic or /admin/login would inherit a redirect loop.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh bg-grey-50 text-ink">{children}</div>;
}
