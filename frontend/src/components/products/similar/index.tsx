import Link from "next/link";
import type { SimilarProduct } from "@/types/products";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CmsMedia } from "@/components/ui/CmsMedia";

type SimilarProps = {
  categoryName: string;
  items: SimilarProduct[];
  categorySlug: string;
};

/**
 * Figma 313:1283. Grid of other published products in the same category.
 * Renders nothing when there are none (e.g. a category with a single
 * product).
 */
export default function Similar({ categoryName, items, categorySlug }: SimilarProps) {
  if (items.length === 0) return null;

  return (
    <section className="w-full bg-grey-50 py-16 lg:py-20">
      <Container className="flex flex-col gap-10">
        <SectionHeading heading={`More in ${categoryName}`} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item._id}
              href={`/products/${categorySlug}/${item.slug}`}
              className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition-colors hover:bg-white/70"
            >
              <div className="relative h-[5.0625rem] w-[5.0625rem] shrink-0 overflow-hidden rounded-[0.875rem] bg-grey-50">
                <CmsMedia media={item.thumbnail} alt={item.name} objectFit="contain" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-base font-semibold text-ink">{item.name}</span>
                <span className="truncate text-sm text-grey-500">{item.subtitle}</span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element -- static Figma SVG, not CMS content. */}
              <img src="/products/chevron.svg" alt="" className="h-4 w-4 shrink-0" />
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
