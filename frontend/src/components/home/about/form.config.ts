import type { Field } from "@/components/admin/form/types";

export const formConfig: Field[] = [
  {
    name: "eyebrowLeft",
    label: "Eyebrow (left)",
    kind: "text",
    maxLength: 60,
    help: 'e.g. "Proudly part of"',
  },
  { name: "partnerLogo", label: "Partner logo", kind: "media", accept: "image" },
  {
    name: "eyebrowRight",
    label: "Eyebrow (right)",
    kind: "text",
    maxLength: 100,
    help: 'e.g. "India\'s #1 cable & wire company"',
  },
  {
    name: "statement",
    label: "Statement",
    kind: "highlightText",
    help: "Highlight a substring to colour it brand red.",
  },
  { name: "button", label: "Button", kind: "button" },
  { name: "image", label: "Image", kind: "media", accept: "image" },
  { name: "clientsCaption", label: "Clients caption", kind: "text", maxLength: 200 },
  {
    name: "clients",
    label: "Client names",
    kind: "repeater",
    itemLabel: "name",
    min: 0,
    max: 40,
    newItem: () => ({ name: "" }),
    fields: [{ name: "name", label: "Name", kind: "text", maxLength: 100 }],
  },
];
