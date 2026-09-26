import type { CatalogueData } from "@/types/cms";

export const defaults: CatalogueData = {
  title: "Complete Product Catalogue",
  caption: "2026 edition · 280 pages",
  file: null,
  button: {
    text: "Download PDF",
    href: "",
    withIcon: false,
    icon: null,
    iconPosition: "right",
    openInNewTab: true,
  },
};
