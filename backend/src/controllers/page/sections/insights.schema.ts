import { z } from "zod";
import { buttonSchema, mediaSchema, shortText } from "./shared.schema";

// API_CONTRACT §4.5 InsightsData
const articleSchema = z.object({
  image: mediaSchema,
  tag: shortText(200),
  dateLabel: shortText(200),
  title: shortText(200),
  button: buttonSchema,
});

export const insightsSchema = z.object({
  heading: shortText(200),
  allLabel: shortText(200), // "All"
  filterTags: z.array(shortText(200)).max(20), // matched against article.tag, case-insensitive
  articles: z.array(articleSchema).max(20),
});

export type InsightsData = z.infer<typeof insightsSchema>;

export const insightsDefaults = (): InsightsData => ({
  heading: "",
  allLabel: "",
  filterTags: [],
  articles: [],
});
