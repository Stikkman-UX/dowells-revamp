"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminCategory, AdminProductListItem } from "@/types/products";
import { reorderProductsBrowser } from "@/lib/api/products.client";
import { ApiError } from "@/lib/api/error";
import { useToast } from "@/components/admin/ui/Toast";
import { ProductRow } from "./ProductRow";

type Props = {
  categories: AdminCategory[];
  products: AdminProductListItem[];
  selectedCategoryId: string;
};

export function ProductsList({ categories, products, selectedCategoryId }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [reordering, setReordering] = useState(false);

  const canReorder = Boolean(selectedCategoryId);

  function handleCategoryChange(value: string) {
    router.push(value ? `/admin/products?categoryId=${encodeURIComponent(value)}` : "/admin/products");
  }

  async function move(index: number, dir: -1 | 1) {
    if (!canReorder || reordering) return;
    const target = index + dir;
    if (target < 0 || target >= products.length) return;
    const ids = products.map((p) => p._id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    setReordering(true);
    try {
      await reorderProductsBrowser({ categoryId: selectedCategoryId, ids });
      router.refresh();
    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : "Could not reorder products", "error");
    } finally {
      setReordering(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-ink">Products</h1>
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="category-filter" className="text-sm text-grey-500">
            Category
          </label>
          <select
            id="category-filter"
            value={selectedCategoryId}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="rounded-md border border-grey-300 bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/40"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-dark"
          >
            New product
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-grey-200 bg-white shadow-sm">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-grey-200 text-xs font-medium uppercase tracking-wide text-grey-500">
              <th scope="col" className="px-4 py-3">Name</th>
              <th scope="col" className="px-4 py-3">Category</th>
              <th scope="col" className="px-4 py-3">Slug</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3">Updated</th>
              <th scope="col" className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-grey-500">
                  {selectedCategoryId ? "No products in this category yet." : "No products yet."}
                </td>
              </tr>
            )}
            {products.map((product, index) => (
              <ProductRow
                key={product._id}
                product={product}
                canReorder={canReorder}
                canMoveUp={index > 0}
                canMoveDown={index < products.length - 1}
                reordering={reordering}
                onMove={(dir) => move(index, dir)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
