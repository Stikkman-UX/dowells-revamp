import type { Field } from "@/components/admin/form/types";
import { blankCtaButton, buttonLeafFields } from "@/components/admin/form/types";
import type { HeroData } from "@/types/cms";

function newCarouselItem(): HeroData["carousel"][number] {
  return { media: null, poster: null };
}

function newStat() {
  return { value: "", label: "" };
}

export const formConfig: Field[] = [
  {
    kind: "highlightText",
    name: "heading",
    label: "Heading",
    help: "Shown over every carousel item.",
  },
  {
    kind: "repeater",
    name: "buttons",
    label: "CTA buttons",
    help: "Up to 4 buttons, shown in this order under the heading.",
    min: 0,
    max: 4,
    itemLabel: "text",
    newItem: blankCtaButton,
    fields: [
      {
        kind: "select",
        name: "variant",
        label: "Style",
        options: [
          { value: "red", label: "Red" },
          { value: "white", label: "White" },
        ],
      },
      ...buttonLeafFields,
    ],
  },
  {
    kind: "repeater",
    name: "stats",
    label: "Stats",
    help: "Up to 6 stats shown in the glass bar at the bottom of the hero.",
    min: 0,
    max: 6,
    itemLabel: "label",
    newItem: newStat,
    fields: [
      { kind: "text", name: "value", label: "Value", maxLength: 200 },
      { kind: "text", name: "label", label: "Label", maxLength: 200 },
    ],
  },
  {
    kind: "repeater",
    name: "carousel",
    label: "Carousel",
    help: "1–8 background images or videos the hero auto-advances through.",
    min: 1,
    max: 8,
    itemLabel: "media.alt",
    newItem: newCarouselItem,
    fields: [
      {
        kind: "media",
        name: "media",
        label: "Media",
        accept: "image+video",
        help: "Full-bleed background image or video.",
      },
      {
        kind: "media",
        name: "poster",
        label: "Poster image",
        accept: "image",
        help: "Required when the media is a video.",
      },
    ],
  },
];
