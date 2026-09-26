import type {
  AdminCategory,
  AdminProduct,
  AdminProductListItem,
  CategoryInput,
  ProductInput,
} from "@/types/products";
import { browserApiFetch } from "./browser";

// Client Components only (Categories/Products admin screens — Phase 4).
// Server code uses `./products`. Every mutation here is followed by the
// caller's `router.refresh()` (CLAUDE.md "Caching").

export function createCategoryBrowser(input: CategoryInput) {
  return browserApiFetch<{ category: AdminCategory }>("/admin/categories", {
    method: "POST",
    body: input,
  });
}

export function updateCategoryBrowser(
  id: string,
  input: CategoryInput & { rev: number }
) {
  return browserApiFetch<{ category: AdminCategory }>(`/admin/categories/${id}`, {
    method: "PUT",
    body: input,
  });
}

export function deleteCategoryBrowser(id: string) {
  return browserApiFetch<void>(`/admin/categories/${id}`, { method: "DELETE" });
}

export function reorderCategoriesBrowser(ids: string[]) {
  return browserApiFetch<{ categories: AdminCategory[] }>("/admin/categories/reorder", {
    method: "PUT",
    body: { ids },
  });
}

export function createProductBrowser(input: ProductInput) {
  return browserApiFetch<{ product: AdminProduct }>("/admin/products", {
    method: "POST",
    body: input,
  });
}

export function updateProductBrowser(id: string, input: ProductInput & { rev: number }) {
  return browserApiFetch<{ product: AdminProduct }>(`/admin/products/${id}`, {
    method: "PUT",
    body: input,
  });
}

export function deleteProductBrowser(id: string) {
  return browserApiFetch<void>(`/admin/products/${id}`, { method: "DELETE" });
}

export function publishProductBrowser(
  id: string,
  body: { isPublished: boolean; rev: number }
) {
  return browserApiFetch<{ product: AdminProductListItem }>(
    `/admin/products/${id}/publish`,
    { method: "PUT", body }
  );
}

export function reorderProductsBrowser(body: { categoryId: string; ids: string[] }) {
  return browserApiFetch<{ products: AdminProductListItem[] }>("/admin/products/reorder", {
    method: "PUT",
    body,
  });
}

export function getAdminProductBrowser(id: string) {
  return browserApiFetch<{ product: AdminProduct }>(`/admin/products/${id}`);
}
