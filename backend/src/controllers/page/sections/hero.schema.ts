import { z } from "zod";
import {
  ctaButtonSchema,
  defaultHighlight,
  defaultMedia,
  highlightTextSchema,
  mediaSchema,
  statSchema,
} from "./shared.schema";

// API_CONTRACT §4.5 HeroData
const carouselItemSchema = z.object({
  media: mediaSchema, // Image or Video
  poster: mediaSchema, // required (and must be Image) when media is a Video — mediaRefs.ts
});

export const heroSchema = z.object({
  heading: highlightTextSchema,
  buttons: z.array(ctaButtonSchema).max(4),
  stats: z.array(statSchema).max(6),
  carousel: z.array(carouselItemSchema).min(1).max(8),
});

export type HeroData = z.infer<typeof heroSchema>;

// min(1) on carousel means an empty array is not structurally valid — the
// default value is exactly one blank item instead.
export const heroDefaults = (): HeroData => ({
  heading: defaultHighlight(),
  buttons: [],
  stats: [],
  carousel: [{ media: defaultMedia(), poster: defaultMedia() }],
});
