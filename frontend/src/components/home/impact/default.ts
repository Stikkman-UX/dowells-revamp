import type { ImpactData, ResolvedMedia } from "@/types/cms";

function image(url: string, alt: string): ResolvedMedia {
  return { assetId: "", alt, url, mimeType: "image/png", fileType: "Image", fileSize: 0 };
}

export const defaults: ImpactData = {
  heading: "Dowell’s impact across sectors.",
  button: {
    text: "All projects",
    href: "#",
    withIcon: true,
    icon: {
      assetId: "",
      alt: "",
      url: "/home/impact/icon-all-projects-arrow.svg",
      mimeType: "image/svg+xml",
      fileType: "Image",
      fileSize: 0,
    },
    iconPosition: "right",
    openInNewTab: false,
  },
  cards: [
    {
      image: image("/home/impact/expressway-lighting.png", ""),
      tag: "Case Study",
      title: "Powering India's longest expressway lighting network",
      meta: "Infrastructure · 2025",
      href: "#",
    },
    {
      image: image("/home/impact/switchgear-assembly.png", ""),
      tag: "In Action",
      title: "Switchgear assembly with our crimp-free ferrules",
      meta: "",
      href: "#",
    },
    {
      image: image("/home/impact/solar-farm.png", ""),
      tag: "On Site",
      title: "1.2 GW solar farm — terminated end-to-end with Dowells",
      meta: "",
      href: "#",
    },
  ],
};
