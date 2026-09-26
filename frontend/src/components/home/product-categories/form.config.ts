import type { Field } from "@/components/admin/form/types";
import { blankButton } from "@/components/admin/form/types";

function blankCategory() {
  return {
    name: "",
    countLabel: "",
    badge: "",
    description: "",
    image: null,
    button: blankButton(),
  };
}

export const formConfig: Field[] = [
  { name: "heading", label: "Heading", kind: "text", maxLength: 200 },
  {
    name: "categories",
    label: "Categories",
    kind: "repeater",
    min: 1,
    max: 8,
    itemLabel: "name",
    newItem: blankCategory,
    help: "Same order drives both the tab list and the feature panel. The first category is shown by default.",
    fields: [
      { name: "name", label: "Name", kind: "text", maxLength: 200, help: "Tab label and panel title." },
      { name: "countLabel", label: "Tab count label", kind: "text", maxLength: 50, help: "e.g. \"2,300+ SKUs\"." },
      { name: "badge", label: "Panel badge", kind: "text", maxLength: 50, help: "e.g. \"320+ products\"." },
      { name: "description", label: "Description", kind: "textarea", maxLength: 1000 },
      { name: "image", label: "Panel image", kind: "media", accept: "image" },
      { name: "button", label: "Explore button", kind: "button" },
    ],
  },
];
