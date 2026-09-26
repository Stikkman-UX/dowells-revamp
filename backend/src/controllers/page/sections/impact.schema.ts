import { z } from "zod";
import { buttonSchema, defaultButton, defaultMedia, hrefSchema, mediaSchema, shortText } from "./shared.schema";

// API_CONTRACT §4.5 ImpactData
const cardSchema = z.object({
  image: mediaSchema,
  tag: shortText(200),
  title: shortText(200),
  meta: shortText(200),
  href: hrefSchema,
});

export const impactSchema = z.object({
  heading: shortText(200),
  button: buttonSchema, // "All projects"
  cards: z.array(cardSchema).max(3), // first is the large card
});

export type ImpactData = z.infer<typeof impactSchema>;

export const impactDefaults = (): ImpactData => ({
  heading: "",
  button: defaultButton(),
  cards: [],
});
