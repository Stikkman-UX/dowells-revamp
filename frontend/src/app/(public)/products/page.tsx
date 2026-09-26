import { notFound, redirect } from "next/navigation";
import { getPublicCategories } from "@/lib/api/products";

/**
 * There is no public product listing page (API_CONTRACT §6): `/products`
 * always redirects to the first published product of the first category.
 * `null` (outage) throws to `(public)/error.tsx`; an empty list (no
 * published products at all) is a real 404.
 */
export default async function ProductsIndexPage() {
  const categories = await getPublicCategories();

  if (categories === null) {
    throw new Error("Products are temporarily unavailable");
  }

  if (categories.length === 0) {
    notFound();
  }

  const category = categories[0];
  redirect(`/products/${category.slug}/${category.products[0].slug}`);
}
