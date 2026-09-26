import { z } from "zod";
import { defaultMedia, hrefSchema, longText, mediaSchema, shortText } from "./shared.schema";

// API_CONTRACT §4.5 QuickAccessData
const searchCardSchema = z.object({
  icon: mediaSchema,
  title: shortText(200),
  subtitle: shortText(200),
  placeholder: shortText(200),
  buttonLabel: shortText(200),
  image: mediaSchema,
  href: hrefSchema,
});

const cardSchema = z.object({
  icon: mediaSchema,
  title: shortText(200),
  subtitle: shortText(200),
  image: mediaSchema,
  href: hrefSchema,
});

export const quickAccessSchema = z.object({
  heading: shortText(200),
  description: longText(1000),
  searchCard: searchCardSchema,
  cards: z.array(cardSchema).max(3), // wide, small, small (design order)
});

export type QuickAccessData = z.infer<typeof quickAccessSchema>;

export const quickAccessDefaults = (): QuickAccessData => ({
  heading: "",
  description: "",
  searchCard: {
    icon: defaultMedia(),
    title: "",
    subtitle: "",
    placeholder: "",
    buttonLabel: "",
    image: defaultMedia(),
    href: "",
  },
  cards: [],
});
