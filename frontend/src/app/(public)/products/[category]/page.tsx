import { notFound, redirect } from "next/navigation";
import { getPublicCategories } from "@/lib/api/products";

/**
 * `/products/[category]` redirects to that category's first published
 * product. Unknown category slug or a category with no published products
 * is a 404; an outage (`null`) throws to `(public)/error.tsx`.
 */
export default async function ProductsCategoryPage({
  params,
}: PageProps<"/products/[category]">) {
  const { category: categorySlug } = await params;
  const categories = await getPublicCategories();

  if (categories === null) {
    throw new Error("Products are temporarily unavailable");
  }

  const category = categories.find((c) => c.slug === categorySlug);

  if (!category || category.products.length === 0) {
    notFound();
  }

  redirect(`/products/${category.slug}/${category.products[0].slug}`);
}
