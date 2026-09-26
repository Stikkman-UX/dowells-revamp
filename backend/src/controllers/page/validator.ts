import { z } from "zod";
import { RequestValidationSchema } from "@utils/helper/zod";
import { seoSchema } from "./sections/shared.schema";

/**
 * Only the REQUEST ENVELOPE is validated here (params shape, and — for
 * section writes — the {isVisible, data, rev} wrapper with `data` left as
 * `z.unknown()`). The section's own schema depends on the runtime `:key`
 * route param, which a static per-route schema can't express, so it's
 * applied in services.ts after the envelope passes (per the task brief).
 */

const slugParam = z.string().trim().min(1).max(100);
const keyParam = z.string().trim().min(1).max(100);

export const getPublicPage = {
  params: z.object({ slug: slugParam }).strict(),
} satisfies RequestValidationSchema;

export const getAdminPage = {
  params: z.object({ slug: slugParam }).strict(),
} satisfies RequestValidationSchema;

export const putSection = {
  params: z.object({ slug: slugParam, key: keyParam }).strict(),
  body: z
    .object({
      isVisible: z.boolean(),
      data: z.unknown(),
      rev: z.number().int().min(0),
    })
    .strict(),
} satisfies RequestValidationSchema;

// Seo has no runtime-dependent shape, so it's validated in full here — paths
// on failure are e.g. "canonical" / "ogImage.assetId" (relative to the body,
// which IS the Seo object — no "data." prefix, unlike section writes).
export const putSeo = {
  params: z.object({ slug: slugParam }).strict(),
  body: seoSchema.strict(),
} satisfies RequestValidationSchema;
