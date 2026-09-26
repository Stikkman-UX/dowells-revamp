import { z } from "zod";
import { buttonSchema, defaultButton, mediaSchema, shortText } from "./shared.schema";

// API_CONTRACT §4.4 CatalogueData — the site-wide product catalogue PDF,
// rendered on every product page (not by the layout). `file` must resolve
// to fileType "Document" (enforced by collectAssetIssues); `button.href` is
// ignored at render time — the file's own URL is used.
export const catalogueSchema = z.object({
  title: shortText(),
  caption: shortText(),
  file: mediaSchema,
  button: buttonSchema,
});

export type CatalogueData = z.infer<typeof catalogueSchema>;

export const catalogueDefaults = (): CatalogueData => ({
  title: "Complete Product Catalogue",
  caption: "2026 edition · 280 pages",
  file: null,
  button: {
    ...defaultButton(),
    text: "Download PDF",
    iconPosition: "right",
    openInNewTab: true,
  },
});
