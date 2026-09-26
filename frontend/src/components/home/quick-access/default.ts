import type { QuickAccessData, ResolvedMedia } from "@/types/cms";

function media(
  url: string,
  alt: string,
  mimeType: string = "image/png"
): ResolvedMedia {
  return { assetId: "", alt, url, mimeType, fileType: "Image", fileSize: 0 };
}

function svgIcon(url: string, alt: string): ResolvedMedia {
  return media(url, alt, "image/svg+xml");
}

export const defaults: QuickAccessData = {
  heading: "What can we help you with today?",
  description:
    "One common place - to seek all key information about the brand and the products.",
  searchCard: {
    icon: svgIcon("/home/quick-access/icon-search-card.svg", ""),
    title: "Find the right product fast.",
    subtitle: "5,000+ SKUs across lugs, glands, ferrules and more.",
    placeholder: "Search by name, SKU or spec…",
    buttonLabel: "Search",
    image: media("/home/quick-access/search-card-bg.png", ""),
    href: "#",
  },
  cards: [
    {
      icon: svgIcon("/home/quick-access/icon-distributor.svg", ""),
      title: "Find a Distributor",
      subtitle: "250+ outlets nationwide.",
      image: media("/home/quick-access/distributor-pin.png", "", "image/png"),
      href: "#",
    },
    {
      icon: svgIcon("/home/quick-access/icon-download.svg", ""),
      title: "Download Centre",
      subtitle: "2026 edition · PDF · 18 MB",
      image: null,
      href: "#",
    },
    {
      icon: svgIcon("/home/quick-access/icon-browse-industries.svg", ""),
      title: "Browse Industries",
      subtitle: "By sector & application",
      image: media("/home/quick-access/browse-industries-bg.png", ""),
      href: "#",
    },
  ],
};
