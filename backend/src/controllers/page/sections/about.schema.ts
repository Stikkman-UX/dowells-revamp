import { z } from "zod";
import {
  buttonSchema,
  defaultButton,
  defaultHighlight,
  defaultMedia,
  highlightTextSchema,
  mediaSchema,
  shortText,
} from "./shared.schema";

// API_CONTRACT §4.5 AboutData
const clientSchema = z.object({
  name: shortText(200),
});

export const aboutSchema = z.object({
  eyebrowLeft: shortText(200),
  partnerLogo: mediaSchema,
  eyebrowRight: shortText(200),
  statement: highlightTextSchema,
  button: buttonSchema,
  image: mediaSchema,
  clientsCaption: shortText(200),
  clients: z.array(clientSchema).max(40),
});

export type AboutData = z.infer<typeof aboutSchema>;

export const aboutDefaults = (): AboutData => ({
  eyebrowLeft: "",
  partnerLogo: defaultMedia(),
  eyebrowRight: "",
  statement: defaultHighlight(),
  button: defaultButton(),
  image: defaultMedia(),
  clientsCaption: "",
  clients: [],
});
