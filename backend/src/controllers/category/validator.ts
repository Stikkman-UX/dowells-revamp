import { z } from "zod";
import { RequestValidationSchema } from "@utils/helper/zod";
import { longText, objectIdSchema, shortText, slugSchema } from "@controllers/page/sections/shared.schema";

/**
 * Request-envelope validation for Categories (API_CONTRACT §6). `id` route
 * params are validated as 24-hex ObjectIds (422 at path "id") — this is what
 * keeps `/reorder` from ever reaching the `:id` handlers as long as the
 * route registers `/reorder` first (see routes/categoryRoutes.ts).
 */

export const categoryInputSchema = z.object({
  name: shortText(200),
  slug: slugSchema,
  description: longText(1000),
});
export type CategoryInputData = z.infer<typeof categoryInputSchema>;

const idParams = z.object({ id: objectIdSchema }).strict();

export const create = {
  body: categoryInputSchema.strict(),
} satisfies RequestValidationSchema;

export const update = {
  params: idParams,
  body: categoryInputSchema.extend({ rev: z.number().int().min(0) }).strict(),
} satisfies RequestValidationSchema;

export const remove = {
  params: idParams,
} satisfies RequestValidationSchema;

export const reorder = {
  body: z.object({ ids: z.array(objectIdSchema) }).strict(),
} satisfies RequestValidationSchema;
