import { z } from "zod";
import { hrefSchema, longText, mediaSchema, shortText } from "./shared.schema";

// API_CONTRACT §4.5 IndustriesData
const slideSchema = z.object({
  image: mediaSchema,
  title: shortText(200),
  description: longText(1000),
  href: hrefSchema,
});

export const industriesSchema = z.object({
  heading: shortText(200),
  slides: z.array(slideSchema).max(20), // no explicit limit in the contract
});

export type IndustriesData = z.infer<typeof industriesSchema>;

export const industriesDefaults = (): IndustriesData => ({
  heading: "",
  slides: [],
});
