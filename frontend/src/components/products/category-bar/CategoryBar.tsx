"use client";

import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/Container";
import type { PublicCategory } from "@/types/products";

type CategoryBarProps = {
  categories: PublicCategory[] | null;
  categorySlug: string;
  productSlug: string;
};

// The chevron is a static Figma glyph (public/products/chevron-down.svg),
// not CMS content, so it's a plain background-image rather than CmsIcon.
const SELECT_STYLE = {
  backgroundImage: "url('/products/chevron-down.svg')",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 0.75rem center",
  backgroundSize: "0.6875rem",
};

const SELECT_CLASS =
  "min-w-0 appearance-none rounded-sm border border-transparent bg-white py-2 pl-4 pr-9 text-sm font-medium text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

/**
 * Thin, non-sticky bar directly under the header (Figma 313:1510). Two
 * native `<select>`s keep this keyboard/a11y-accessible without building a
 * custom listbox — styled with the design's chevron via a background image.
 * Degrades to a plain label when `categories` failed to load or the current
 * category isn't in the list (API_CONTRACT §5 — the page itself already
 * rendered from a successful product fetch, so this is defensive only).
 *
 * D-5A-3: below `sm` the row stacks (label+category, then product, then the
 * count) so the selects get the full 360px-minus-gutters width instead of
 * being squeezed to a sliver by the count pill in a single wrapped row;
 * `min-w-0` on the selects lets that full width actually apply instead of
 * the browser holding out for the intrinsic (option-text) min-width. At
 * `sm` and up it becomes the single-row Figma layout.
 */
export default function CategoryBar({
  categories,
  categorySlug,
  productSlug,
}: CategoryBarProps) {
  const router = useRouter();
  const category = categories?.find((c) => c.slug === categorySlug) ?? null;

  if (!categories || !category) {
    return (
      <div className="w-full bg-grey-50">
        <Container className="flex items-center py-2.5 text-sm text-grey-600">
          <span>Category</span>
        </Container>
      </div>
    );
  }

  function handleCategoryChange(event: ChangeEvent<HTMLSelectElement>) {
    const next = categories!.find((c) => c.slug === event.target.value);
    if (next?.products[0]) {
      router.push(`/products/${next.slug}/${next.products[0].slug}`);
    }
  }

  function handleProductChange(event: ChangeEvent<HTMLSelectElement>) {
    router.push(`/products/${category!.slug}/${event.target.value}`);
  }

  return (
    <div className="w-full bg-grey-50">
      <Container className="flex flex-col gap-3 py-2.5 text-sm sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <span className="shrink-0 text-grey-600">Category :</span>

          <select
            aria-label="Category"
            value={categorySlug}
            onChange={handleCategoryChange}
            style={SELECT_STYLE}
            className={`${SELECT_CLASS} min-w-0 w-full sm:w-auto`}
          >
            {categories.map((c) => (
              <option key={c._id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <span aria-hidden="true" className="hidden shrink-0 text-grey-400 sm:block">
          /
        </span>

        <select
          aria-label="Product"
          value={productSlug}
          onChange={handleProductChange}
          style={SELECT_STYLE}
          className={`${SELECT_CLASS} min-w-0 w-full truncate sm:w-auto sm:min-w-[12rem] sm:max-w-xs sm:flex-1`}
        >
          {category.products.map((p) => (
            <option key={p._id} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>

        <span className="flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-pill bg-ink/5 px-3 py-1.5 text-xs text-grey-600 sm:ml-auto">
          <span aria-hidden="true" className="inline-block h-1 w-1 rounded-full bg-ink/60" />
          {category.products.length} Products
        </span>
      </Container>
    </div>
  );
}
