import { z } from "zod";
import { defaultMedia, longText, mediaSchema, shortText, statSchema } from "./shared.schema";

// API_CONTRACT §4.5 TrustData
const certificationSchema = z.object({
  icon: mediaSchema, // SVG — enforced in mediaRefs.ts
  label: shortText(200),
});

export const trustSchema = z.object({
  eyebrow: shortText(200),
  heading: shortText(200),
  description: longText(1000),
  certifications: z.array(certificationSchema).max(8),
  stats: z.array(statSchema).max(4),
  image: mediaSchema,
});

export type TrustData = z.infer<typeof trustSchema>;

export const trustDefaults = (): TrustData => ({
  eyebrow: "",
  heading: "",
  description: "",
  certifications: [],
  stats: [],
  image: defaultMedia(),
});
