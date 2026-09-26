import Link from "next/link";
import type { Metadata } from "next";
import { listAdminCategories } from "@/lib/api/products";
import { ProductForm } from "@/components/admin/products/ProductForm";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  const { categories } = await listAdminCategories();

  if (categories.length === 0) {
    return (
      <div className="rounded-lg border border-grey-200 bg-white p-6 text-sm text-grey-600 shadow-sm">
        <p>You need at least one category before you can create a product.</p>
        <Link href="/admin/categories" className="mt-3 inline-block font-medium text-brand hover:underline">
          Go to Categories
        </Link>
      </div>
    );
  }

  return <ProductForm mode="create" categories={categories} />;
}
