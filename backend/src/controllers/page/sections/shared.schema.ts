import { z } from "zod";

/**
 * Building blocks shared by every section schema (API_CONTRACT §4.1). Kept
 * page-generic on purpose — nothing here knows about "home" or any other
 * slug. Section schemas (./*.schema.ts) compose these.
 *
 * All plain objects here are intentionally NOT `.strict()`: the admin UI
 * round-trips RESOLVED media objects (assetId, alt, url, mimeType, fileType)
 * on save, and the contract requires the extra keys (url/mimeType/fileType)
 * to be silently stripped back down to the stored form, not rejected. Zod
 * objects strip unknown keys by default, so this falls out for free.
 */

// ---- text ---------------------------------------------------------------

/** Single-line text, ≤ `max` chars (contract default 200). */
export const shortText = (max = 200) => z.string().trim().max(max);

/** Multi-line text, ≤ `max` chars (contract default 1000). */
export const longText = (max = 1000) => z.string().trim().max(max);

// ---- href -----------------------------------------------------------------

/**
 * "" (no link), a root-relative path ("/foo", never protocol-relative
 * "//foo"), a "#fragment", or an absolute http(s)/mailto/tel URL. Anything
 * else — notably `javascript:` — is rejected (API_CONTRACT §4.1).
 */
const isSafeHref = (value: string): boolean => {
  if (value === "") return true;
  if (value.startsWith("#")) return true;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  if (/^https?:\/\//i.test(value)) return true;
  if (/^mailto:/i.test(value)) return true;
  if (/^tel:/i.test(value)) return true;
  return false;
};

export const hrefSchema = z
  .string()
  .trim()
  .refine(isSafeHref, {
    message:
      'href must be "", a "/relative" path, a "#fragment", or an absolute http(s)/mailto/tel URL',
  });

/** Seo.canonical: "" or an absolute http(s) URL or a root-relative "/path". */
const isSafeCanonical = (value: string): boolean => {
  if (value === "") return true;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  if (/^https?:\/\//i.test(value)) return true;
  return false;
};

export const canonicalSchema = z
  .string()
  .trim()
  .refine(isSafeCanonical, {
    message: 'canonical must be "", a "/relative" path, or an absolute http(s) URL',
  });

// ---- slug (Phase 2: categories/products) -----------------------------------

/** Lowercase, hyphen-separated, ≤ 80 chars — e.g. "power-cables". Admin
 *  provided and editable; uniqueness is enforced by the owning collection. */
export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase letters, numbers and single hyphens only (e.g. "power-cables")',
  });

/** A 24-hex Mongo ObjectId string (categoryId, :id route params, …). */
export const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, { message: "must be a valid id" });

// ---- media ----------------------------------------------------------------

/** Stored form only (assetId + alt) — resolution happens at read time. */
export const mediaRefSchema = z.object({
  assetId: z.string().trim().min(1),
  alt: shortText(200),
});
export type MediaRefData = z.infer<typeof mediaRefSchema>;

export const mediaSchema = mediaRefSchema.nullable();
export type MediaData = z.infer<typeof mediaSchema>;

// ---- highlight text ---------------------------------------------------

export const highlightTextSchema = z
  .object({
    text: longText(1000),
    highlight: shortText(200),
  })
  .refine((value) => value.highlight === "" || value.text.includes(value.highlight), {
    message: 'highlight must be "" or a substring of text',
    path: ["highlight"],
  });
export type HighlightTextData = z.infer<typeof highlightTextSchema>;

// ---- link / button / stat -----------------------------------------------

export const linkItemSchema = z.object({
  label: shortText(200),
  href: hrefSchema,
});
export type LinkItemData = z.infer<typeof linkItemSchema>;

export const buttonSchema = z.object({
  text: shortText(200),
  href: hrefSchema,
  withIcon: z.boolean(),
  icon: mediaSchema,
  iconPosition: z.enum(["left", "right"]),
  openInNewTab: z.boolean(),
});
export type ButtonData = z.infer<typeof buttonSchema>;

/** A Button whose colour the admin picks (e.g. hero CTAs). */
export const ctaButtonSchema = buttonSchema.extend({
  variant: z.enum(["red", "white"]),
});
export type CtaButtonData = z.infer<typeof ctaButtonSchema>;

export const statSchema = z.object({
  value: shortText(200),
  label: shortText(200),
});
export type StatData = z.infer<typeof statSchema>;

// ---- seo (shared by every "page"-kind entry, API_CONTRACT §4.3) ---------

export const seoSchema = z.object({
  title: shortText(200),
  description: longText(1000),
  canonical: canonicalSchema,
  noindex: z.boolean(),
  ogImage: mediaSchema,
});
export type SeoData = z.infer<typeof seoSchema>;

// ---- default-value helpers ------------------------------------------------
// Used by registry section `defaults()` to build a structurally valid empty
// value for a never-saved section (API_CONTRACT §4.3 "rev: 0" case).

export const defaultMedia = (): MediaData => null;

export const defaultButton = (): ButtonData => ({
  text: "",
  href: "",
  withIcon: false,
  icon: null,
  iconPosition: "left",
  openInNewTab: false,
});

export const defaultCtaButton = (): CtaButtonData => ({ ...defaultButton(), variant: "red" });

export const defaultStat = (): StatData => ({ value: "", label: "" });

export const defaultHighlight = (): HighlightTextData => ({ text: "", highlight: "" });

export const defaultLinkItem = (): LinkItemData => ({ label: "", href: "" });

export const emptySeo = (): SeoData => ({
  title: "",
  description: "",
  canonical: "",
  noindex: false,
  ogImage: null,
});
