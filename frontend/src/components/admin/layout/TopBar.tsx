"use client";

import { useState } from "react";
import type { User } from "@/types/cms";
import { logoutBrowser } from "@/lib/api/auth.client";
import { LogoutIcon, MenuIcon } from "./icons";

export function TopBar({ user, onMenuClick }: { user: User; onMenuClick: () => void }) {
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logoutBrowser();
    } catch {
      // Best-effort: clear cookies server-side regardless of the response.
    }
    // Full navigation so the Router Cache is dropped along with the session.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- deliberate full reload, not a router transition
    window.location.assign("/admin/login");
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-grey-200 bg-white px-4 lg:px-8">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
        className="rounded-md p-1.5 text-grey-600 hover:bg-grey-100 lg:hidden"
      >
        <MenuIcon className="h-5 w-5" />
      </button>
      <div className="hidden lg:block" />
      <div className="flex items-center gap-3">
        <span className="text-sm text-grey-600">
          <span className="font-medium text-ink">{user.name}</span>
        </span>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-grey-600 hover:bg-grey-100 hover:text-ink disabled:opacity-50"
        >
          <LogoutIcon className="h-4 w-4" />
          {loggingOut ? "Signing out…" : "Log out"}
        </button>
      </div>
    </header>
  );
}
