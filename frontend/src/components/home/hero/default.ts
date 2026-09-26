import type { HeroData } from "@/types/cms";

export const defaults: HeroData = {
  heading: { text: "Connections that power progress.", highlight: "power" },
  buttons: [
    {
      variant: "red",
      text: "Find Products",
      href: "#",
      withIcon: true,
      icon: {
        assetId: "",
        alt: "",
        url: "/home/hero/icon-search.svg",
        mimeType: "image/svg+xml",
        fileType: "Image",
        fileSize: 0,
      },
      iconPosition: "left",
      openInNewTab: false,
    },
    {
      variant: "white",
      text: "Find Nearest Dealer",
      href: "#",
      withIcon: true,
      icon: {
        assetId: "",
        alt: "",
        url: "/home/hero/icon-pin.svg",
        mimeType: "image/svg+xml",
        fileType: "Image",
        fileSize: 0,
      },
      iconPosition: "left",
      openInNewTab: false,
    },
  ],
  stats: [
    { value: "55+", label: "Years of trust" },
    { value: "250+", label: "Distributors" },
    { value: "5,000+", label: "SKUs" },
    { value: "40+", label: "Countries" },
  ],
  carousel: [
    {
      media: {
        assetId: "",
        alt: "A Dowells technician inspecting a cable accessory on the factory floor",
        url: "/home/hero/slide-1-connections-that-power-progress.jpg",
        mimeType: "image/jpeg",
        fileType: "Image",
        fileSize: 0,
      },
      poster: null,
    },
    {
      media: {
        assetId: "",
        alt: "A welder working on a steel structure inside a Dowells manufacturing plant",
        url: "/home/hero/slide-2-manufacturing-excellence.jpg",
        mimeType: "image/jpeg",
        fileType: "Image",
        fileSize: 0,
      },
      poster: null,
    },
  ],
};
