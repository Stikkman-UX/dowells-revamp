import Link from "next/link";
import type { Metadata } from "next";
import { listAdminPages } from "@/lib/api/pages";
import { Badge } from "@/components/admin/ui/Badge";
import { formatDateTime } from "@/components/admin/lib/format";

export const metadata: Metadata = { title: "Pages" };

export default async function PagesListPage() {
  const { pages } = await listAdminPages();

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold text-ink">Pages</h1>

      <div className="overflow-x-auto rounded-lg border border-grey-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-grey-200 text-xs font-medium uppercase tracking-wide text-grey-500">
              <th scope="col" className="px-4 py-3">Title</th>
              <th scope="col" className="px-4 py-3">Type</th>
              <th scope="col" className="px-4 py-3">Path</th>
              <th scope="col" className="px-4 py-3">Sections</th>
              <th scope="col" className="px-4 py-3">Updated</th>
              <th scope="col" className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => (
              <tr key={page.slug} className="border-b border-grey-100 last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{page.title}</td>
                <td className="px-4 py-3">
                  {page.kind === "global" ? (
                    <Badge tone="neutral">Site-wide (Header &amp; Footer)</Badge>
                  ) : (
                    <Badge tone="brand">Page</Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-grey-500">{page.path || "—"}</td>
                <td className="px-4 py-3 text-grey-500">{page.sectionKeys.length}</td>
                <td className="px-4 py-3 text-grey-500">{formatDateTime(page.updatedAt)}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/pages/${page.slug}`}
                    className="font-medium text-brand hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
