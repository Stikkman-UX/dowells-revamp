import "server-only";
import { cache } from "react";
import type {
  AdminCategory,
  AdminProduct,
  AdminProductListItem,
  PublicCategory,
  PublicProduct,
  SimilarProduct,
} from "@/types/products";
import { serverApiFetch, serverPublicFetch, serverPublicFetchDetailed } from "./server";

// Server Components only. Client Components (admin mutations) use
// `./products.client`.

/** Returns null on any failure — callers fall back to a plain `/products` link. */
export async function getPublicCategories(): Promise<PublicCategory[] | null> {
  const data = await serverPublicFetch<{ categories: PublicCategory[] }>(
    "/products/categories"
  );
  return data?.categories ?? null;
}

/**
 * Wrapped in React `cache()` so a product page's `generateMetadata` and the
 * page body share one backend request per render. `status` lets the caller
 * tell a 404 (-> `notFound()`) apart from an outage (-> throw to
 * `error.tsx`) — API_CONTRACT §5.
 */
export const getPublicProduct = cache(
  async (
    categorySlug: string,
    productSlug: string
  ): Promise<{
    status: number;
    data: { product: PublicProduct; similar: SimilarProduct[] } | null;
  }> => {
    return serverPublicFetchDetailed<{ product: PublicProduct; similar: SimilarProduct[] }>(
      `/products/${categorySlug}/${productSlug}`
    );
  }
);

export function listAdminCategories() {
  return serverApiFetch<{ categories: AdminCategory[] }>("/admin/categories");
}

export function listAdminProducts(categoryId?: string) {
  const query = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : "";
  return serverApiFetch<{ products: AdminProductListItem[] }>(`/admin/products${query}`);
}

export function getAdminProduct(id: string) {
  return serverApiFetch<{ product: AdminProduct }>(`/admin/products/${id}`);
}
