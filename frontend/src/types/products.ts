/**
 * Types mirrored from API_CONTRACT.md §6 (Products). Keep these in sync with
 * the contract — it is the source of truth, not this file. Second contract
 * mirror next to `types/cms.ts` (see frontend/CLAUDE.md "Products module"):
 * Categories/Products are entity resources, not page-registry sections.
 */

import type { Button, Media, ResolvedMedia, ResolvedSeo, Seo } from "./cms";

// ---------------------------------------------------------------------------
// Stored form (what the admin sends)
// ---------------------------------------------------------------------------

/** `^[a-z0-9]+(?:-[a-z0-9]+)*$`, <= 80 chars — enforced backend-side. */
export type Slug = string;

export type CategoryInput = { name: string; slug: Slug; description: string };

export type ProductHero = {
  image: Media;
  description: string;
  keySpecs: { icon: Media; label: string; value: string }[];
  idealFor: string[];
  primaryButton: Button;
  secondaryButton: Button;
};

export type ProductDownloads = {
  heading: string;
  items: { title: string; file: Media }[];
};

export type ProductSpecs = {
  heading: string;
  items: { icon: Media; label: string; value: string }[];
};

export type ProductDeployed = {
  heading: string;
  items: { title: string; description: string; image: Media }[];
};

export type ProductSafety = {
  heading: string;
  bullets: string[];
  image: Media;
  certifications: { icon: Media; label: string }[];
};

export type ProductInput = {
  categoryId: string;
  name: string;
  slug: Slug;
  subtitle: string;
  isPublished: boolean;
  seo: Seo;
  hero: ProductHero;
  downloads: ProductDownloads;
  specs: ProductSpecs;
  deployed: ProductDeployed;
  safety: ProductSafety;
};

// ---------------------------------------------------------------------------
// Resolved form (what every GET returns — every `Media` expanded in place)
// ---------------------------------------------------------------------------

/**
 * Recursively swaps `Media` for `ResolvedMedia` through a stored content
 * block, so `ProductHero`/`ProductDownloads`/etc. don't need a hand-written
 * resolved twin (keeps the two shapes in sync as the contract evolves).
 * `Button` already stores `ResolvedMedia` for its own `icon` (see
 * `types/cms.ts`), so recursing into one is a no-op.
 */
type Resolved<T> = T extends Media
  ? ResolvedMedia
  : T extends readonly (infer U)[]
    ? Resolved<U>[]
    : T extends object
      ? { [K in keyof T]: Resolved<T[K]> }
      : T;

export type ProductSummary = {
  _id: string;
  name: string;
  slug: Slug;
  subtitle: string;
};

/** Only categories with >= 1 published product; in category order. */
export type PublicCategory = {
  _id: string;
  name: string;
  slug: Slug;
  description: string;
  products: ProductSummary[];
};

export type PublicProduct = {
  _id: string;
  name: string;
  slug: Slug;
  subtitle: string;
  updatedAt: string;
  category: { _id: string; name: string; slug: Slug; description: string };
  seo: ResolvedSeo;
  hero: Resolved<ProductHero>;
  downloads: Resolved<ProductDownloads>;
  specs: Resolved<ProductSpecs>;
  deployed: Resolved<ProductDeployed>;
  safety: Resolved<ProductSafety>;
};

/** = the other published products of the same category (`hero.image` as `thumbnail`). */
export type SimilarProduct = ProductSummary & { thumbnail: ResolvedMedia };

export type AdminCategory = CategoryInput & {
  _id: string;
  order: number;
  productCount: number;
  rev: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminProductListItem = ProductSummary & {
  categoryId: string;
  category: { name: string; slug: Slug };
  isPublished: boolean;
  order: number;
  rev: number;
  updatedAt: string;
};

export type AdminProduct = {
  _id: string;
  categoryId: string;
  name: string;
  slug: Slug;
  subtitle: string;
  isPublished: boolean;
  order: number;
  rev: number;
  createdAt: string;
  updatedAt: string;
  seo: ResolvedSeo;
  hero: Resolved<ProductHero>;
  downloads: Resolved<ProductDownloads>;
  specs: Resolved<ProductSpecs>;
  deployed: Resolved<ProductDeployed>;
  safety: Resolved<ProductSafety>;
};
