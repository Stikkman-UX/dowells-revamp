import { z } from "zod";
import {
  buttonSchema,
  defaultButton,
  defaultMedia,
  hrefSchema,
  mediaSchema,
  shortText,
} from "./shared.schema";

// API_CONTRACT §4.4 HeaderData
const navItemSchema = z.object({
  label: shortText(200),
  href: hrefSchema,
  showChevron: z.boolean(),
});

export const headerSchema = z.object({
  logo: mediaSchema,
  logoHref: hrefSchema,
  navItems: z.array(navItemSchema).max(20),
  showSearch: z.boolean(),
  searchHref: hrefSchema,
  ctaButton: buttonSchema,
});

export type HeaderData = z.infer<typeof headerSchema>;

export const headerDefaults = (): HeaderData => ({
  logo: defaultMedia(),
  logoHref: "",
  navItems: [],
  showSearch: false,
  searchHref: "",
  ctaButton: defaultButton(),
});
