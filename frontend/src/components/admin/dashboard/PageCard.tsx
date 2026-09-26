import Link from "next/link";
import type { AdminPageListItem } from "@/types/cms";
import { Badge } from "@/components/admin/ui/Badge";
import { formatDateTime } from "@/components/admin/lib/format";

export function PageCard({ page }: { page: AdminPageListItem }) {
  return (
    <div className="flex flex-col rounded-lg border border-grey-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink">{page.title}</h3>
        {page.kind === "global" ? (
          <Badge tone="neutral">Site-wide</Badge>
        ) : (
          <Badge tone="brand">Page</Badge>
        )}
      </div>
      {page.path && <p className="mt-1 text-xs text-grey-500">{page.path}</p>}
      <div className="mt-3 flex items-center gap-3 text-xs text-grey-500">
        <span>
          {page.sectionKeys.length} section{page.sectionKeys.length === 1 ? "" : "s"}
        </span>
        <span aria-hidden="true">·</span>
        <span>Updated {formatDateTime(page.updatedAt)}</span>
      </div>
      <Link
        href={`/admin/pages/${page.slug}`}
        className="mt-4 inline-flex w-fit items-center rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-dark"
      >
        Edit
      </Link>
    </div>
  );
}
