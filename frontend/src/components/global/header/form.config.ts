import type { Field } from "@/components/admin/form/types";

export const formConfig: Field[] = [
  {
    name: "logo",
    label: "Logo",
    kind: "media",
    accept: "image",
    help: "Site logo shown in the header. Logos may be raster or SVG.",
  },
  { name: "logoHref", label: "Logo link", kind: "url", help: "Where the logo links to — usually the homepage." },
  {
    name: "navItems",
    label: "Navigation links",
    kind: "repeater",
    itemLabel: "label",
    min: 0,
    max: 20,
    newItem: () => ({ label: "", href: "", showChevron: false }),
    fields: [
      { name: "label", label: "Label", kind: "text", maxLength: 60 },
      { name: "href", label: "Link", kind: "url" },
      {
        name: "showChevron",
        label: "Show chevron",
        kind: "boolean",
        help: "The item whose link is /products opens the Category → Product menu.",
      },
    ],
  },
  { name: "showSearch", label: "Show search icon", kind: "boolean" },
  { name: "searchHref", label: "Search link", kind: "url" },
  { name: "ctaButton", label: "Call-to-action button", kind: "button" },
];
