import { z } from "zod";
import {
  buttonSchema,
  defaultButton,
  defaultMedia,
  hrefSchema,
  linkItemSchema,
  longText,
  mediaSchema,
  shortText,
} from "./shared.schema";

// API_CONTRACT §4.4 FooterData
const socialSchema = z.object({
  icon: mediaSchema,
  label: shortText(200),
  href: hrefSchema,
});

const columnSchema = z.object({
  title: shortText(200),
  links: z.array(linkItemSchema).max(20),
});

export const footerSchema = z.object({
  newsletter: z.object({
    heading: shortText(200),
    placeholder: shortText(200),
    button: buttonSchema,
  }),
  logo: mediaSchema,
  description: longText(1000),
  phone: shortText(200),
  email: shortText(200),
  socials: z.array(socialSchema).max(20),
  columns: z.array(columnSchema).max(6),
  copyright: shortText(200),
  legalLinks: z.array(linkItemSchema).max(20),
});

export type FooterData = z.infer<typeof footerSchema>;

export const footerDefaults = (): FooterData => ({
  newsletter: { heading: "", placeholder: "", button: defaultButton() },
  logo: defaultMedia(),
  description: "",
  phone: "",
  email: "",
  socials: [],
  columns: [],
  copyright: "",
  legalLinks: [],
});
