import type { AboutData } from "@/types/cms";

export const defaults: AboutData = {
  eyebrowLeft: "Proudly part of",
  partnerLogo: {
    assetId: "",
    alt: "Polycab",
    url: "/home/about/polycab-logo.png",
    mimeType: "image/png",
    fileType: "Image",
    fileSize: 0,
  },
  eyebrowRight: "India's #1 cable & wire company",
  statement: {
    text: "A Polycab company, engineering every connection Since 1968. Dowell’s brand is a synonym for manufacturing great products with agility and quality.",
    highlight: "Since 1968.",
  },
  button: {
    text: "Read our full story",
    href: "#",
    withIcon: true,
    icon: {
      assetId: "",
      alt: "",
      url: "/home/about/arrow-right.svg",
      mimeType: "image/svg+xml",
      fileType: "Image",
      fileSize: 0,
    },
    iconPosition: "right",
    openInNewTab: false,
  },
  image: {
    assetId: "",
    alt: "Team members at a Dowell's manufacturing facility",
    url: "/home/about/team-photo.png",
    mimeType: "image/png",
    fileType: "Image",
    fileSize: 0,
  },
  clientsCaption: "Trusted by India's largest builders & EPCs",
  clients: [
    { name: "L&T" },
    { name: "Tata Power" },
    { name: "Adani" },
    { name: "NTPC" },
    { name: "Reliance" },
    { name: "Siemens" },
    { name: "ABB" },
    { name: "BHEL" },
  ],
};
