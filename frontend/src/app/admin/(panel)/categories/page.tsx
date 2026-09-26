import type { Metadata } from "next";
import { listAdminCategories } from "@/lib/api/products";
import { CategoriesManager } from "@/components/admin/categories/CategoriesManager";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const { categories } = await listAdminCategories();

  return <CategoriesManager categories={categories} />;
}
