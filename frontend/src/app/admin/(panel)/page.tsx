import Link from "next/link";
import type { Metadata } from "next";
import { listAdminPages } from "@/lib/api/pages";
import { PageCard } from "@/components/admin/dashboard/PageCard";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { pages } = await listAdminPages();

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold text-ink">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pages.map((page) => (
          <PageCard key={page.slug} page={page} />
        ))}
      </div>

      <h2 className="mt-8 mb-3 text-sm font-semibold text-ink">Content</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/categories"
          className="flex flex-col rounded-lg border border-grey-200 bg-white p-5 shadow-sm transition-colors hover:border-brand/40"
        >
          <h3 className="text-sm font-semibold text-ink">Categories</h3>
          <p className="mt-1 text-xs text-grey-500">Manage the product categories shown on the site.</p>
        </Link>
        <Link
          href="/admin/products"
          className="flex flex-col rounded-lg border border-grey-200 bg-white p-5 shadow-sm transition-colors hover:border-brand/40"
        >
          <h3 className="text-sm font-semibold text-ink">Products</h3>
          <p className="mt-1 text-xs text-grey-500">Create, edit and publish products.</p>
        </Link>
      </div>
    </div>
  );
}
