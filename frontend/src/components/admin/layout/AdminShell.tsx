"use client";

import { useState, type ReactNode } from "react";
import type { User } from "@/types/cms";
import { ToastProvider } from "@/components/admin/ui/Toast";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { CloseIcon } from "./icons";

export function AdminShell({ user, children }: { user: User; children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="flex min-h-dvh">
        <aside className="hidden w-60 shrink-0 border-r border-grey-200 bg-white lg:block">
          <Sidebar />
        </aside>

        {drawerOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-ink/50"
              onClick={() => setDrawerOpen(false)}
            />
            <aside className="relative z-10 flex h-full w-64 flex-col bg-white shadow-xl">
              <div className="flex justify-end p-2">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close navigation menu"
                  className="rounded-md p-1.5 text-grey-600 hover:bg-grey-100"
                >
                  <CloseIcon className="h-5 w-5" />
                </button>
              </div>
              <Sidebar onNavigate={() => setDrawerOpen(false)} />
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar user={user} onMenuClick={() => setDrawerOpen(true)} />
          <main className="flex-1 p-4 lg:p-8">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
