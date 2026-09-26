import type { MetadataRoute } from "next";
import { pageRegistry } from "@/content/registry";
import { getPublicCategories } from "@/lib/api/products";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Registry pages are derived automatically — adding a future page to
 * `pageRegistry` (with a `kind: "page"` and a `path`) is enough for it to
 * show up here. Product pages are entity pages (no registry entry), so every
 * published product is appended separately from `getPublicCategories()`
 * (API_CONTRACT §6); a `null` result (backend outage) just omits them rather
 * than failing the sitemap.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pageEntries = Object.values(pageRegistry)
    .filter((page) => page.kind === "page")
    .map((page) => ({
      url: new URL(page.path, SITE_URL).toString(),
    }));

  const categories = await getPublicCategories();
  const productEntries =
    categories?.flatMap((category) =>
      category.products.map((product) => ({
        url: new URL(`/products/${category.slug}/${product.slug}`, SITE_URL).toString(),
      }))
    ) ?? [];

  return [...pageEntries, ...productEntries];
}
