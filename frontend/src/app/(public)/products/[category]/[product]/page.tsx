import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicCategories, getPublicProduct } from "@/lib/api/products";
import { getPageContent } from "@/content/registry";
import CategoryBar from "@/components/products/category-bar/CategoryBar";
import Hero from "@/components/products/hero";
import Downloads from "@/components/products/downloads";
import Specs from "@/components/products/specs";
import Deployed from "@/components/products/deployed";
import Safety from "@/components/products/safety";
import Similar from "@/components/products/similar";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata({
  params,
}: PageProps<"/products/[category]/[product]">): Promise<Metadata> {
  const { category, product } = await params;
  const { data } = await getPublicProduct(category, product);

  if (!data) return {};

  const { product: p } = data;
  const title = p.seo.title || p.name;
  const description = p.seo.description || p.hero.description;
  const canonical = p.seo.canonical || `/products/${category}/${product}`;
  const ogImage = p.seo.ogImage ?? p.hero.image;

  return {
    title,
    description,
    alternates: { canonical },
    robots: p.seo.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description,
      url: new URL(canonical, SITE_URL).toString(),
      images: ogImage ? [{ url: ogImage.url }] : undefined,
    },
  };
}

/**
 * Product pages are entity pages, not registry pages (API_CONTRACT §5): no
 * built-in defaults, explicit section composition rather than
 * registry-driven rendering. 404 from the product API -> `notFound()`; any
 * other failure (outage) -> throw, caught by `(public)/error.tsx`.
 */
export default async function ProductPage({
  params,
}: PageProps<"/products/[category]/[product]">) {
  const { category, product } = await params;

  const [productResult, categories, global] = await Promise.all([
    getPublicProduct(category, product),
    getPublicCategories(),
    getPageContent("_global"),
  ]);

  if (productResult.status === 404) {
    notFound();
  }

  if (productResult.status === 0 || !productResult.data) {
    throw new Error("Products are temporarily unavailable");
  }

  const { product: p, similar } = productResult.data;

  return (
    <>
      <CategoryBar categories={categories} categorySlug={category} productSlug={product} />
      <Hero product={p} />
      <Downloads product={p} catalogue={global.sections.catalogue} />
      <Specs data={p.specs} />
      <Deployed data={p.deployed} />
      <Safety data={p.safety} />
      <Similar categoryName={p.category.name} items={similar} categorySlug={p.category.slug} />
    </>
  );
}
