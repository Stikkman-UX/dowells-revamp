import type { Field } from "@/components/admin/form/types";

function blankImpactCard() {
  return {
    image: null,
    tag: "",
    title: "",
    meta: "",
    href: "",
  };
}

export const formConfig: Field[] = [
  { name: "heading", label: "Heading", kind: "text", maxLength: 200 },
  { name: "button", label: "\"All projects\" button", kind: "button" },
  {
    name: "cards",
    label: "Project cards",
    kind: "repeater",
    min: 0,
    max: 3,
    itemLabel: "title",
    newItem: blankImpactCard,
    help: "The first card renders large; the rest stack beside it.",
    fields: [
      { name: "image", label: "Image", kind: "media", accept: "image" },
      { name: "tag", label: "Tag", kind: "text", maxLength: 50 },
      { name: "title", label: "Title", kind: "text", maxLength: 200 },
      { name: "meta", label: "Meta line", kind: "text", maxLength: 100, help: "Optional, e.g. \"Infrastructure · 2025\". Leave blank to hide." },
      { name: "href", label: "Link", kind: "url" },
    ],
  },
];
