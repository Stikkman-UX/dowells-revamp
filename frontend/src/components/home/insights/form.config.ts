import type { Field } from "@/components/admin/form/types";
import { blankButton } from "@/components/admin/form/types";

function blankArticle() {
  return {
    image: null,
    tag: "",
    dateLabel: "",
    title: "",
    button: blankButton(),
  };
}

export const formConfig: Field[] = [
  { name: "heading", label: "Heading", kind: "text", maxLength: 200 },
  { name: "allLabel", label: "\"Show all\" filter label", kind: "text", maxLength: 50 },
  {
    name: "filterTags",
    label: "Filter tags",
    kind: "stringList",
    max: 20,
    help: "Matched against each article's tag, case-insensitive. An article whose tag isn't listed here still shows under \"All\".",
  },
  {
    name: "articles",
    label: "Articles",
    kind: "repeater",
    min: 0,
    max: 20,
    itemLabel: "title",
    newItem: blankArticle,
    fields: [
      { name: "image", label: "Image", kind: "media", accept: "image" },
      { name: "tag", label: "Tag", kind: "text", maxLength: 50 },
      { name: "dateLabel", label: "Date label", kind: "text", maxLength: 50, help: "e.g. \"Apr 2026\"." },
      { name: "title", label: "Title", kind: "text", maxLength: 200 },
      { name: "button", label: "\"Read article\" button", kind: "button" },
    ],
  },
];
