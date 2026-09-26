"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminProductListItem } from "@/types/products";
import { deleteProductBrowser, publishProductBrowser } from "@/lib/api/products.client";
import { ApiError } from "@/lib/api/error";
import { useToast } from "@/components/admin/ui/Toast";
import { Badge } from "@/components/admin/ui/Badge";
import { Switch } from "@/components/admin/ui/Switch";
import { ConfirmDialog } from "@/components/admin/ui/ConfirmDialog";
import { formatDateTime } from "@/components/admin/lib/format";

type Props = {
  product: AdminProductListItem;
  canReorder: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  reordering: boolean;
  onMove: (dir: -1 | 1) => void;
};

/** One row of `ProductsList` — owns its own publish-toggle and delete state so one row's pending action never disables another's. */
export function ProductRow({ product, canReorder, canMoveUp, canMoveDown, reordering, onMove }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [publishing, setPublishing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function togglePublish(next: boolean) {
    setPublishing(true);
    try {
      await publishProductBrowser(product._id, { isPublished: next, rev: product.rev });
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        toast.show("This product changed elsewhere, reloading", "info");
        router.refresh();
      } else {
        toast.show(err instanceof ApiError ? err.message : "Could not update this product", "error");
      }
    } finally {
      setPublishing(false);
    }
  }

  async function handleDeleteConfirmed() {
    setDeleting(true);
    try {
      await deleteProductBrowser(product._id);
      toast.show("Product deleted", "success");
      setConfirmDelete(false);
      router.refresh();
    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : "Could not delete this product", "error");
    } finally {
      setDeleting(false);
    }
  }

  const reorderTitle = canReorder ? undefined : "Filter by category to reorder";

  return (
    <tr className="border-b border-grey-100 last:border-0">
      <td className="px-4 py-3">
        <div className="font-medium text-ink">{product.name}</div>
        {product.subtitle && <div className="text-xs text-grey-500">{product.subtitle}</div>}
      </td>
      <td className="px-4 py-3 text-grey-500">{product.category.name}</td>
      <td className="px-4 py-3 text-grey-500">{product.slug}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Badge tone={product.isPublished ? "success" : "neutral"}>
            {product.isPublished ? "Published" : "Draft"}
          </Badge>
          <Switch
            id={`publish-${product._id}`}
            checked={product.isPublished}
            onChange={togglePublish}
            disabled={publishing}
            label="Published"
          />
        </div>
      </td>
      <td className="px-4 py-3 text-grey-500">{formatDateTime(product.updatedAt)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={!canReorder || !canMoveUp || reordering}
            aria-label={`Move ${product.name} up`}
            title={reorderTitle}
            className="rounded p-1.5 text-grey-500 hover:bg-grey-100 disabled:opacity-30"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={!canReorder || !canMoveDown || reordering}
            aria-label={`Move ${product.name} down`}
            title={reorderTitle}
            className="rounded p-1.5 text-grey-500 hover:bg-grey-100 disabled:opacity-30"
          >
            ↓
          </button>
          <Link
            href={`/admin/products/${product._id}`}
            className="rounded px-2 py-1.5 font-medium text-brand hover:bg-brand/10"
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            aria-label={`Delete ${product.name}`}
            className="rounded px-2 py-1.5 font-medium text-red-500 hover:bg-red-50"
          >
            Delete
          </button>
        </div>

        <ConfirmDialog
          open={confirmDelete}
          title="Delete product"
          message={`Delete "${product.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          loading={deleting}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setConfirmDelete(false)}
        />
      </td>
    </tr>
  );
}
