import { blankButton, blankMedia } from "@/components/admin/form/types";
import type { AdminProduct } from "@/types/products";

/**
 * The shape `ProductForm`'s reducer holds in `state.data` — every
 * `ProductInput` field except `isPublished` (carried in the reducer's
 * `isVisible` slot instead, per `sectionFormReducer`). Reuses `AdminProduct`'s
 * already-resolved block types (`Resolved<ProductHero>` etc.) so this never
 * drifts from the admin GET response shape.
 */
export type ProductFormData = {
  categoryId: string;
  name: string;
  slug: string;
  subtitle: string;
  hero: AdminProduct["hero"];
  downloads: AdminProduct["downloads"];
  specs: AdminProduct["specs"];
  deployed: AdminProduct["deployed"];
  safety: AdminProduct["safety"];
  seo: AdminProduct["seo"];
};

/** Initial data for `/admin/products/new` — Figma copy pre-filled, everything else blank. */
export function newProductDefaults(categoryId: string): ProductFormData {
  return {
    categoryId,
    name: "",
    slug: "",
    subtitle: "",
    hero: {
      image: blankMedia,
      description: "",
      keySpecs: [],
      idealFor: [],
      primaryButton: { ...blankButton(), text: "Find Dealer" },
      secondaryButton: { ...blankButton(), text: "Contact Sales" },
    },
    downloads: {
      heading: "Everything your engineers need.",
      items: [],
    },
    specs: {
      heading: "Built to perform.",
      items: [],
    },
    deployed: {
      heading: "Where this product is deployed.",
      items: [],
    },
    safety: {
      heading: "Engineered for safety and longevity.",
      bullets: [],
      image: blankMedia,
      certifications: [],
    },
    seo: {
      title: "",
      description: "",
      canonical: "",
      noindex: false,
      ogImage: blankMedia,
    },
  };
}

/** Picks the editable slice of an `AdminProduct` GET/PUT response into form data. */
export function productToFormData(product: AdminProduct): ProductFormData {
  return {
    categoryId: product.categoryId,
    name: product.name,
    slug: product.slug,
    subtitle: product.subtitle,
    hero: product.hero,
    downloads: product.downloads,
    specs: product.specs,
    deployed: product.deployed,
    safety: product.safety,
    seo: product.seo,
  };
}
