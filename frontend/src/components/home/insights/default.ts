import type { InsightsData, ResolvedMedia } from "@/types/cms";

function image(url: string, alt: string, mimeType: string): ResolvedMedia {
  return { assetId: "", alt, url, mimeType, fileType: "Image", fileSize: 0 };
}

function readArticleButton() {
  return {
    text: "Read article",
    href: "#",
    withIcon: true,
    icon: {
      assetId: "",
      alt: "",
      url: "/home/insights/icon-read-article-arrow.svg",
      mimeType: "image/svg+xml" as const,
      fileType: "Image" as const,
      fileSize: 0,
    },
    iconPosition: "right" as const,
    openInNewTab: false,
  };
}

export const defaults: InsightsData = {
  heading: "Latest news, Publications and more from Dowell’s",
  allLabel: "All",
  filterTags: ["Whitepaper", "News"],
  articles: [
    {
      image: image("/home/insights/copper-lug.png", "", "image/png"),
      tag: "Guide",
      dateLabel: "Apr 2026",
      title: "How to size a copper lug correctly — a 5-minute primer",
      button: readArticleButton(),
    },
    {
      image: image("/home/insights/plant-capacity.jpeg", "", "image/jpeg"),
      tag: "News",
      dateLabel: "Mar 2026",
      title: "Dowells expands Halol plant: 30% added capacity for 2026",
      button: readArticleButton(),
    },
    {
      image: image("/home/insights/panel-technician.png", "", "image/png"),
      tag: "Whitepaper",
      dateLabel: "Feb 2026",
      title: "Why crimp quality is the #1 cause of LT panel failures",
      button: readArticleButton(),
    },
  ],
};
