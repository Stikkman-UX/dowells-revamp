import type { Field } from "@/components/admin/form/types";
import type { IndustriesData } from "@/types/cms";

function newSlide(): IndustriesData["slides"][number] {
  return { image: null, title: "", description: "", href: "" };
}

export const formConfig: Field[] = [
  { kind: "text", name: "heading", label: "Heading", maxLength: 200 },
  {
    kind: "repeater",
    name: "slides",
    label: "Slides",
    help: "Industries shown in the horizontal peeking slider.",
    min: 0,
    max: 20,
    itemLabel: "title",
    newItem: newSlide,
    fields: [
      { kind: "media", name: "image", label: "Image", accept: "image" },
      { kind: "text", name: "title", label: "Title", maxLength: 200 },
      {
        kind: "textarea",
        name: "description",
        label: "Description",
        maxLength: 1000,
      },
      { kind: "url", name: "href", label: "Link" },
    ],
  },
];
