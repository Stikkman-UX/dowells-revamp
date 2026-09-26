import type { HeaderData } from "@/types/cms";

export const defaults: HeaderData = {
  logo: {
    assetId: "",
    alt: "Dowell's",
    url: "/global/header/dowells-logo.png",
    mimeType: "image/png",
    fileType: "Image",
    fileSize: 0,
  },
  logoHref: "/",
  navItems: [
    { label: "Company", href: "#", showChevron: true },
    { label: "Products", href: "/products", showChevron: true },
    { label: "Industries", href: "#", showChevron: false },
    { label: "CSR & Sustainability", href: "#", showChevron: false },
    { label: "Customer Support", href: "#", showChevron: true },
  ],
  showSearch: true,
  searchHref: "#",
  ctaButton: {
    text: "Contact Us",
    href: "#",
    withIcon: false,
    icon: null,
    iconPosition: "left",
    openInNewTab: false,
  },
};
