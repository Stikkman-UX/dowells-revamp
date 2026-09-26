import type { Field } from "@/components/admin/form/types";
import { blankMedia } from "@/components/admin/form/types";

function blankQuickAccessCard() {
  return {
    icon: blankMedia,
    title: "",
    subtitle: "",
    image: blankMedia,
    href: "",
  };
}

export const formConfig: Field[] = [
  { name: "heading", label: "Heading", kind: "text", maxLength: 200 },
  {
    name: "description",
    label: "Description",
    kind: "textarea",
    maxLength: 1000,
    help: "Shown to the right of the heading on desktop.",
  },
  {
    name: "searchCard",
    label: "Search card",
    kind: "group",
    help: "The large dark card on the left. Visual only — the search box does not submit yet.",
    fields: [
      { name: "icon", label: "Icon", kind: "media", accept: "svg" },
      { name: "title", label: "Title", kind: "text", maxLength: 200 },
      { name: "subtitle", label: "Subtitle", kind: "text", maxLength: 200 },
      {
        name: "placeholder",
        label: "Search input placeholder",
        kind: "text",
        maxLength: 200,
      },
      { name: "buttonLabel", label: "Search button label", kind: "text", maxLength: 50 },
      { name: "image", label: "Background image", kind: "media", accept: "image" },
      {
        name: "href",
        label: "Link",
        kind: "url",
        help: "Where the corner arrow links to. The search box itself never navigates.",
      },
    ],
  },
  {
    name: "cards",
    label: "Shortcut cards",
    kind: "repeater",
    min: 0,
    max: 3,
    itemLabel: "title",
    newItem: blankQuickAccessCard,
    help: "In design order: card 1 renders wide, cards 2–3 render side by side.",
    fields: [
      { name: "icon", label: "Icon", kind: "media", accept: "svg" },
      { name: "title", label: "Title", kind: "text", maxLength: 200 },
      { name: "subtitle", label: "Subtitle", kind: "text", maxLength: 200 },
      { name: "image", label: "Background image", kind: "media", accept: "image" },
      { name: "href", label: "Link", kind: "url" },
    ],
  },
];
