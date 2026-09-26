"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardIcon, PagesIcon, CategoriesIcon, ProductsIcon } from "./icons";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", Icon: DashboardIcon, exact: true },
  { href: "/admin/pages", label: "Pages", Icon: PagesIcon, exact: false },
  { href: "/admin/categories", label: "Categories", Icon: CategoriesIcon, exact: false },
  { href: "/admin/products", label: "Products", Icon: ProductsIcon, exact: false },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex h-full flex-col gap-1 p-4" aria-label="Admin navigation">
      <div className="mb-4 px-2 text-sm font-semibold text-ink">Dowell&apos;s CMS</div>
      {NAV_ITEMS.map(({ href, label, Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              active ? "bg-brand/10 text-brand-dark" : "text-grey-600 hover:bg-grey-100 hover:text-ink"
            }`}
          >
            <Icon className="h-4.5 w-4.5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
