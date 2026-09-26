import { blankMedia, type Field } from "@/components/admin/form/types";
import type { AdminCategory } from "@/types/products";

/**
 * Client-side only (contains `newItem` functions, like every section
 * `form.config.ts` — see frontend/CLAUDE.md "Products module"). Built from
 * `categories` because the category picker's options come from the admin's
 * live category list, not a fixed enum. Uses only field kinds `FieldRenderer`
 * already dispatches — no new field kind was needed for the Products module.
 */
export function buildProductFormConfig(categories: AdminCategory[]): Field[] {
  return [
    {
      kind: "select",
      name: "categoryId",
      label: "Category",
      options: categories.map((c) => ({ value: c._id, label: c.name })),
    },
    { kind: "text", name: "name", label: "Name", maxLength: 200 },
    {
      kind: "text",
      name: "slug",
      label: "Slug",
      help: "lowercase-with-hyphens; changing it changes the public URL",
    },
    { kind: "text", name: "subtitle", label: "Subtitle", maxLength: 200 },

    {
      kind: "group",
      name: "hero",
      label: "Hero",
      fields: [
        { kind: "media", name: "image", label: "Image", accept: "image" },
        { kind: "textarea", name: "description", label: "Description", maxLength: 1000 },
        {
          kind: "repeater",
          name: "keySpecs",
          label: "Key specs",
          max: 6,
          itemLabel: "label",
          newItem: () => ({ icon: blankMedia, label: "", value: "" }),
          fields: [
            { kind: "media", name: "icon", label: "Icon", accept: "svg" },
            { kind: "text", name: "label", label: "Label", maxLength: 200 },
            { kind: "text", name: "value", label: "Value", maxLength: 200 },
          ],
        },
        { kind: "stringList", name: "idealFor", label: "Ideal for", max: 8 },
        { kind: "button", name: "primaryButton", label: "Primary button (Find Dealer)" },
        { kind: "button", name: "secondaryButton", label: "Secondary button (Contact Sales)" },
      ],
    },

    {
      kind: "group",
      name: "downloads",
      label: "Downloads",
      fields: [
        { kind: "text", name: "heading", label: "Heading", maxLength: 200 },
        {
          kind: "repeater",
          name: "items",
          label: "Files",
          max: 10,
          itemLabel: "title",
          newItem: () => ({ title: "", file: blankMedia }),
          fields: [
            { kind: "text", name: "title", label: "Title", maxLength: 200 },
            { kind: "media", name: "file", label: "File", accept: "document" },
          ],
        },
      ],
    },

    {
      kind: "group",
      name: "specs",
      label: "Specs",
      fields: [
        { kind: "text", name: "heading", label: "Heading", maxLength: 200 },
        {
          kind: "repeater",
          name: "items",
          label: "Specs",
          max: 8,
          itemLabel: "label",
          newItem: () => ({ icon: blankMedia, label: "", value: "" }),
          fields: [
            { kind: "media", name: "icon", label: "Icon", accept: "svg" },
            { kind: "text", name: "label", label: "Label", maxLength: 200 },
            { kind: "text", name: "value", label: "Value", maxLength: 200 },
          ],
        },
      ],
    },

    {
      kind: "group",
      name: "deployed",
      label: "Deployed",
      help: "The first item renders wide with its description.",
      fields: [
        { kind: "text", name: "heading", label: "Heading", maxLength: 200 },
        {
          kind: "repeater",
          name: "items",
          label: "Deployed locations",
          max: 6,
          itemLabel: "title",
          newItem: () => ({ title: "", description: "", image: blankMedia }),
          fields: [
            { kind: "text", name: "title", label: "Title", maxLength: 200 },
            { kind: "textarea", name: "description", label: "Description", maxLength: 1000 },
            { kind: "media", name: "image", label: "Image", accept: "image" },
          ],
        },
      ],
    },

    {
      kind: "group",
      name: "safety",
      label: "Safety",
      fields: [
        { kind: "text", name: "heading", label: "Heading", maxLength: 200 },
        { kind: "stringList", name: "bullets", label: "Bullets", max: 10 },
        { kind: "media", name: "image", label: "Image", accept: "image" },
        {
          kind: "repeater",
          name: "certifications",
          label: "Certifications",
          max: 8,
          itemLabel: "label",
          newItem: () => ({ icon: blankMedia, label: "" }),
          fields: [
            { kind: "media", name: "icon", label: "Icon", accept: "svg" },
            { kind: "text", name: "label", label: "Label", maxLength: 200 },
          ],
        },
      ],
    },

    {
      kind: "group",
      name: "seo",
      label: "SEO",
      fields: [
        { kind: "text", name: "title", label: "Title", maxLength: 200 },
        { kind: "textarea", name: "description", label: "Description", maxLength: 1000 },
        { kind: "url", name: "canonical", label: "Canonical URL" },
        { kind: "boolean", name: "noindex", label: "Hide from search engines (noindex)" },
        {
          kind: "media",
          name: "ogImage",
          label: "Social share image",
          accept: "image",
          help: "Shown when this product is shared on social platforms.",
        },
      ],
    },
  ];
}
