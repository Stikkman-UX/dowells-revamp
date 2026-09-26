import type { Field } from "@/components/admin/form/types";

export const formConfig: Field[] = [
  {
    name: "newsletter",
    label: "Newsletter",
    kind: "group",
    fields: [
      { name: "heading", label: "Heading", kind: "text", maxLength: 200 },
      { name: "placeholder", label: "Email placeholder", kind: "text", maxLength: 100 },
      { name: "button", label: "Subscribe button", kind: "button", help: "UI only — no submit behaviour yet." },
    ],
  },
  { name: "logo", label: "Logo", kind: "media", accept: "image" },
  { name: "description", label: "Description", kind: "textarea", maxLength: 1000 },
  { name: "phone", label: "Phone number", kind: "text", maxLength: 60, help: "Displayed as a tel: link." },
  { name: "email", label: "Email address", kind: "text", maxLength: 200, help: "Displayed as a mailto: link." },
  {
    name: "socials",
    label: "Social links",
    kind: "repeater",
    itemLabel: "label",
    min: 0,
    max: 20,
    newItem: () => ({ icon: null, label: "", href: "" }),
    fields: [
      { name: "icon", label: "Icon", kind: "media", accept: "svg" },
      {
        name: "label",
        label: "Accessible name",
        kind: "text",
        maxLength: 60,
        help: 'e.g. "LinkedIn" — used as the link\'s accessible name.',
      },
      { name: "href", label: "Link", kind: "url" },
    ],
  },
  {
    name: "columns",
    label: "Link columns",
    kind: "repeater",
    itemLabel: "title",
    min: 0,
    max: 6,
    newItem: () => ({ title: "", links: [] }),
    fields: [
      { name: "title", label: "Column title", kind: "text", maxLength: 60 },
      {
        name: "links",
        label: "Links",
        kind: "repeater",
        itemLabel: "label",
        min: 0,
        max: 20,
        newItem: () => ({ label: "", href: "" }),
        fields: [
          { name: "label", label: "Label", kind: "text", maxLength: 60 },
          { name: "href", label: "Link", kind: "url" },
        ],
      },
    ],
  },
  { name: "copyright", label: "Copyright text", kind: "text", maxLength: 200 },
  {
    name: "legalLinks",
    label: "Legal links",
    kind: "repeater",
    itemLabel: "label",
    min: 0,
    max: 20,
    newItem: () => ({ label: "", href: "" }),
    fields: [
      { name: "label", label: "Label", kind: "text", maxLength: 60 },
      { name: "href", label: "Link", kind: "url" },
    ],
  },
];
