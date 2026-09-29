import { z } from "zod";
import { buttonSchema, defaultButton, defaultMedia, longText, mediaSchema, shortText } from "./shared.schema";

// Admin-picked colour for the panel's CTA. Defaults to "white" so sections
// saved before the field existed keep their original look.
const categoryButtonSchema = buttonSchema.extend({
  variant: z.enum(["red", "white"]).default("white"),
});

// API_CONTRACT §4.5 ProductCategoriesData
const categorySchema = z.object({
  name: shortText(200), // tab label + panel title
  countLabel: shortText(200), // e.g. "2,300+ SKUs"
  badge: shortText(200), // e.g. "320+ products"
  description: longText(1000),
  image: mediaSchema,
  button: categoryButtonSchema,
});

export const productCategoriesSchema = z.object({
  heading: shortText(200),
  categories: z.array(categorySchema).min(1).max(8),
});

export type ProductCategoriesData = z.infer<typeof productCategoriesSchema>;

// min(1) on categories means an empty array is not structurally valid — the
// default value is exactly one blank category instead.
export const productCategoriesDefaults = (): ProductCategoriesData => ({
  heading: "",
  categories: [
    {
      name: "",
      countLabel: "",
      badge: "",
      description: "",
      image: defaultMedia(),
      button: { ...defaultButton(), variant: "white" },
    },
  ],
});
