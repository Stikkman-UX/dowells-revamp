"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminCategory } from "@/types/products";
import { deleteCategoryBrowser, reorderCategoriesBrowser } from "@/lib/api/products.client";
import { ApiError } from "@/lib/api/error";
import { useToast } from "@/components/admin/ui/Toast";
import { Button } from "@/components/admin/ui/Button";
import { ConfirmDialog } from "@/components/admin/ui/ConfirmDialog";
import { formatDateTime } from "@/components/admin/lib/format";
import { CategoryModal } from "./CategoryModal";

type ModalState = { open: boolean; editing: AdminCategory | null };

export function CategoriesManager({ categories }: { categories: AdminCategory[] }) {
  const router = useRouter();
  const toast = useToast();
  const [modal, setModal] = useState<ModalState>({ open: false, editing: null });
  const [deleteTarget, setDeleteTarget] = useState<AdminCategory | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [reordering, setReordering] = useState(false);

  function closeModal() {
    setModal({ open: false, editing: null });
  }

  function handleSaved() {
    closeModal();
    router.refresh();
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= categories.length || reordering) return;
    const ids = categories.map((c) => c._id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    setReordering(true);
    try {
      await reorderCategoriesBrowser(ids);
      router.refresh();
    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : "Could not reorder categories", "error");
    } finally {
      setReordering(false);
    }
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCategoryBrowser(deleteTarget._id);
      toast.show("Category deleted", "success");
      setDeleteTarget(null);
      router.refresh();
    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : "Could not delete this category", "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-ink">Categories</h1>
        <Button variant="primary" onClick={() => setModal({ open: true, editing: null })}>
          New category
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-grey-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-grey-200 text-xs font-medium uppercase tracking-wide text-grey-500">
              <th scope="col" className="px-4 py-3">Name</th>
              <th scope="col" className="px-4 py-3">Slug</th>
              <th scope="col" className="px-4 py-3">Products</th>
              <th scope="col" className="px-4 py-3">Updated</th>
              <th scope="col" className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-grey-500">
                  No categories yet.
                </td>
              </tr>
            )}
            {categories.map((category, index) => (
              <tr key={category._id} className="border-b border-grey-100 last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{category.name}</td>
                <td className="px-4 py-3 text-grey-500">{category.slug}</td>
                <td className="px-4 py-3 text-grey-500">{category.productCount}</td>
                <td className="px-4 py-3 text-grey-500">{formatDateTime(category.updatedAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index === 0 || reordering}
                      aria-label={`Move ${category.name} up`}
                      className="rounded p-1.5 text-grey-500 hover:bg-grey-100 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index === categories.length - 1 || reordering}
                      aria-label={`Move ${category.name} down`}
                      className="rounded p-1.5 text-grey-500 hover:bg-grey-100 disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => setModal({ open: true, editing: category })}
                      aria-label={`Edit ${category.name}`}
                      className="rounded px-2 py-1.5 font-medium text-brand hover:bg-brand/10"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(category)}
                      disabled={category.productCount > 0}
                      title={category.productCount > 0 ? "Move or delete its products first" : undefined}
                      aria-label={`Delete ${category.name}`}
                      className="rounded px-2 py-1.5 font-medium text-red-500 hover:bg-red-50 disabled:opacity-30"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CategoryModal open={modal.open} editing={modal.editing} onClose={closeModal} onSaved={handleSaved} />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete category"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
