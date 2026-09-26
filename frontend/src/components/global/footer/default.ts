import type { FooterData } from "@/types/cms";

export const defaults: FooterData = {
  newsletter: {
    heading: "Get product updates, publications & industry insights.",
    placeholder: "you@company.com",
    button: {
      text: "Subscribe",
      href: "#",
      withIcon: true,
      icon: {
        assetId: "",
        alt: "",
        url: "/global/footer/arrow-right.svg",
        mimeType: "image/svg+xml",
        fileType: "Image",
        fileSize: 0,
      },
      iconPosition: "right",
      openInNewTab: false,
    },
  },
  logo: {
    assetId: "",
    alt: "Dowell's",
    url: "/global/footer/dowells-logo.png",
    mimeType: "image/png",
    fileType: "Image",
    fileSize: 0,
  },
  description:
    "A Polycab Group company. Cable accessories engineered for India's power, industrial and infrastructure sectors.",
  phone: "1800-267-0008 (Toll-free)",
  email: "support@dowells.com",
  socials: [
    {
      icon: {
        assetId: "",
        alt: "",
        url: "/global/footer/social-linkedin.svg",
        mimeType: "image/svg+xml",
        fileType: "Image",
        fileSize: 0,
      },
      label: "LinkedIn",
      href: "#",
    },
    {
      icon: {
        assetId: "",
        alt: "",
        url: "/global/footer/social-facebook.svg",
        mimeType: "image/svg+xml",
        fileType: "Image",
        fileSize: 0,
      },
      label: "Facebook",
      href: "#",
    },
    {
      icon: {
        assetId: "",
        alt: "",
        url: "/global/footer/social-instagram.svg",
        mimeType: "image/svg+xml",
        fileType: "Image",
        fileSize: 0,
      },
      label: "Instagram",
      href: "#",
    },
    {
      icon: {
        assetId: "",
        alt: "",
        url: "/global/footer/social-youtube.svg",
        mimeType: "image/svg+xml",
        fileType: "Image",
        fileSize: 0,
      },
      label: "YouTube",
      href: "#",
    },
  ],
  columns: [
    {
      title: "Products",
      links: [
        { label: "Lugs & Connectors", href: "#" },
        { label: "Cable Glands", href: "#" },
        { label: "Ferrules", href: "#" },
        { label: "Terminations", href: "#" },
        { label: "Heat Shrink", href: "#" },
        { label: "Accessories", href: "#" },
      ],
    },
    {
      title: "Industries",
      links: [
        { label: "Manufacturing", href: "#" },
        { label: "Infrastructure", href: "#" },
        { label: "Utilities", href: "#" },
        { label: "Renewable Energy", href: "#" },
        { label: "Commercial Buildings", href: "#" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Catalogue", href: "#" },
        { label: "Datasheets", href: "#" },
        { label: "Installation Guides", href: "#" },
        { label: "Certifications", href: "#" },
        { label: "FAQs", href: "#" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About Dowells", href: "#" },
        { label: "Polycab Group", href: "#" },
        { label: "News & Press", href: "#" },
        { label: "Careers", href: "#" },
        { label: "Contact", href: "#" },
      ],
    },
  ],
  copyright: "© 2026 Dowells Cable Accessories Ltd. All rights reserved.",
  legalLinks: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
    { label: "Cookies", href: "#" },
    { label: "Sitemap", href: "#" },
  ],
};
