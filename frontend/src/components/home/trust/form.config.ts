import type { Field } from "@/components/admin/form/types";
import type { TrustData } from "@/types/cms";

function newCertification(): TrustData["certifications"][number] {
  return { icon: null, label: "" };
}

function newStat() {
  return { value: "", label: "" };
}

export const formConfig: Field[] = [
  { kind: "text", name: "eyebrow", label: "Eyebrow", maxLength: 200 },
  { kind: "text", name: "heading", label: "Heading", maxLength: 200 },
  {
    kind: "textarea",
    name: "description",
    label: "Description",
    maxLength: 1000,
  },
  {
    kind: "repeater",
    name: "certifications",
    label: "Certifications",
    help: "Up to 8 certification chips.",
    min: 0,
    max: 8,
    itemLabel: "label",
    newItem: newCertification,
    fields: [
      { kind: "media", name: "icon", label: "Icon", accept: "svg" },
      { kind: "text", name: "label", label: "Label", maxLength: 200 },
    ],
  },
  {
    kind: "repeater",
    name: "stats",
    label: "Stats",
    help: "Up to 4 stats pinned over the side image.",
    min: 0,
    max: 4,
    itemLabel: "label",
    newItem: newStat,
    fields: [
      { kind: "text", name: "value", label: "Value", maxLength: 200 },
      { kind: "text", name: "label", label: "Label", maxLength: 200 },
    ],
  },
  { kind: "media", name: "image", label: "Side image", accept: "image" },
];
