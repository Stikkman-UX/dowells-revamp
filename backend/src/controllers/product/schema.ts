import { z } from "zod";
import {
  shortText,
  longText,
  mediaSchema,
  buttonSchema,
  seoSchema,
  defaultButton,
  emptySeo,
  slugSchema,
  objectIdSchema,
} from "@controllers/page/sections/shared.schema";

/**
 * Zod schema for a Product's content (API_CONTRACT §6.1). Built from the
 * same shared pieces as a page section's `data` — `hero/downloads/specs/
 * deployed/safety` are stored as Mixed at the DB layer; this schema is the
 * only place that owns their shape. Objects are intentionally non-strict
 * (see shared.schema.ts) so resolved media extras round-trip harmlessly.
 */

const keySpecItemSchema = z.object({
  icon: mediaSchema,
  label: shortText(200),
  value: shortText(200),
});

export const productHeroSchema = z.object({
  image: mediaSchema,
  description: longText(1000),
  keySpecs: z.array(keySpecItemSchema).max(6),
  idealFor: z.array(shortText(60)).max(8),
  primaryButton: buttonSchema,
  secondaryButton: buttonSchema,
});

const downloadItemSchema = z.object({
  title: shortText(200),
  file: mediaSchema,
});

export const productDownloadsSchema = z.object({
  heading: shortText(200),
  items: z.array(downloadItemSchema).max(10),
});

const specItemSchema = z.object({
  icon: mediaSchema,
  label: shortText(200),
  value: shortText(200),
});

export const productSpecsSchema = z.object({
  heading: shortText(200),
  items: z.array(specItemSchema).max(8),
});

const deployedItemSchema = z.object({
  title: shortText(200),
  description: longText(1000),
  image: mediaSchema,
});

export const productDeployedSchema = z.object({
  heading: shortText(200),
  items: z.array(deployedItemSchema).max(6),
});

const certificationItemSchema = z.object({
  icon: mediaSchema,
  label: shortText(200),
});

export const productSafetySchema = z.object({
  heading: shortText(200),
  bullets: z.array(shortText(300)).max(10),
  image: mediaSchema,
  certifications: z.array(certificationItemSchema).max(8),
});

export const productInputSchema = z.object({
  categoryId: objectIdSchema,
  name: shortText(200),
  slug: slugSchema,
  subtitle: shortText(200),
  isPublished: z.boolean(),
  seo: seoSchema,
  hero: productHeroSchema,
  downloads: productDownloadsSchema,
  specs: productSpecsSchema,
  deployed: productDeployedSchema,
  safety: productSafetySchema,
});

export type ProductInputData = z.infer<typeof productInputSchema>;

/**
 * A structurally valid, empty Product for the given category, pre-filled
 * with the Figma copy (headings + CTA labels) so a freshly created draft
 * already looks right in the admin form.
 */
export const productDefaults = (categoryId: string): ProductInputData => ({
  categoryId,
  name: "",
  slug: "",
  subtitle: "",
  isPublished: false,
  seo: emptySeo(),
  hero: {
    image: null,
    description: "",
    keySpecs: [],
    idealFor: [],
    primaryButton: { ...defaultButton(), text: "Find Dealer" },
    secondaryButton: { ...defaultButton(), text: "Contact Sales" },
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
    image: null,
    certifications: [],
  },
});
