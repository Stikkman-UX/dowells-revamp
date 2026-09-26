import type { Metadata } from "next";
import { listAdminCategories, listAdminProducts } from "@/lib/api/products";
import { ProductsList } from "@/components/admin/products/ProductsList";

export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage({ searchParams }: PageProps<"/admin/products">) {
  const params = await searchParams;
  const raw = params.categoryId;
  const categoryId = typeof raw === "string" ? raw : undefined;

  const [{ categories }, { products }] = await Promise.all([
    listAdminCategories(),
    listAdminProducts(categoryId),
  ]);

  return (
    <ProductsList categories={categories} products={products} selectedCategoryId={categoryId ?? ""} />
  );
}
