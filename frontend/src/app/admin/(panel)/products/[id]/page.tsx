import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAdminProduct, listAdminCategories } from "@/lib/api/products";
import { ApiError } from "@/lib/api/error";
import { ProductForm } from "@/components/admin/products/ProductForm";

export async function generateMetadata({
  params,
}: PageProps<"/admin/products/[id]">): Promise<Metadata> {
  const { id } = await params;
  try {
    const { product } = await getAdminProduct(id);
    return { title: product.name };
  } catch {
    return { title: "Product" };
  }
}

export default async function ProductEditorPage({ params }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;

  let result;
  try {
    result = await Promise.all([listAdminCategories(), getAdminProduct(id)]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }
  const [{ categories }, { product }] = result;

  return <ProductForm mode="edit" categories={categories} product={product} />;
}
