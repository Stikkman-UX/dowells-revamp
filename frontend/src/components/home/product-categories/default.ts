import type { ProductCategoriesData, ResolvedMedia } from "@/types/cms";

function image(url: string, alt: string): ResolvedMedia {
  return { assetId: "", alt, url, mimeType: "image/jpeg", fileType: "Image", fileSize: 0 };
}

function exploreButton() {
  return {
    text: "Explore products",
    href: "#",
    withIcon: true,
    icon: {
      assetId: "",
      alt: "",
      url: "/home/product-categories/icon-explore-arrow.svg",
      mimeType: "image/svg+xml" as const,
      fileType: "Image" as const,
      fileSize: 0,
    },
    iconPosition: "right" as const,
    openInNewTab: false,
  };
}

export const defaults: ProductCategoriesData = {
  heading: "Our Product Categories",
  categories: [
    {
      name: "Cable Terminals",
      countLabel: "2,300+ SKUs",
      badge: "320+ products",
      description:
        "Robust solutions for heavy-duty plants, OEM lines and process automation environments.",
      image: image("/home/product-categories/cable-terminals.png", ""),
      button: exploreButton(),
    },
    {
      name: "Crimping Tools",
      countLabel: "180+ products",
      badge: "180+ products",
      description:
        "Precision hand and hydraulic crimpers engineered for consistent, code-compliant terminations.",
      image: image("/home/product-categories/crimping-tools.jpeg", ""),
      button: exploreButton(),
    },
    {
      name: "Cable Glands",
      countLabel: "240+ products",
      badge: "240+ products",
      description:
        "DISCOM-grade lugs, terminations and joints for LT and HT distribution networks.",
      image: image("/home/product-categories/cable-glands.png", ""),
      button: exploreButton(),
    },
    {
      name: "Pre-Insulated",
      countLabel: "90+ products",
      badge: "90+ products",
      description:
        "Solar-rated, UV-stable accessories engineered for utility-scale renewable plants.",
      image: image("/home/product-categories/pre-insulated.jpeg", ""),
      button: exploreButton(),
    },
    {
      name: "Bi-Metallic",
      countLabel: "150+ products",
      badge: "150+ products",
      description:
        "Copper-to-aluminium connectors engineered to eliminate galvanic corrosion at the joint.",
      image: image("/home/product-categories/bi-metallic.jpeg", ""),
      button: exploreButton(),
    },
  ],
};
