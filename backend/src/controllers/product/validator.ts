import { z } from "zod";
import { RequestValidationSchema } from "@utils/helper/zod";
import { objectIdSchema, slugSchema } from "@controllers/page/sections/shared.schema";
import { productInputSchema } from "./schema";

/**
 * Request-envelope validation for Products (API_CONTRACT §6). `:id` route
 * params are 24-hex ObjectIds (422 at path "id"); `create`/`update` bodies
 * are `.strict()` (no `data.` prefix — issue paths are body-relative, e.g.
 * "hero.keySpecs.0.icon").
 */

const idParams = z.object({ id: objectIdSchema }).strict();

export const getPublicProduct = {
  params: z.object({ categorySlug: slugSchema, productSlug: slugSchema }).strict(),
} satisfies RequestValidationSchema;

export const listAdmin = {
  query: z.object({ categoryId: objectIdSchema.optional() }).strict(),
} satisfies RequestValidationSchema;

export const getAdmin = {
  params: idParams,
} satisfies RequestValidationSchema;

export const create = {
  body: productInputSchema.strict(),
} satisfies RequestValidationSchema;

export const update = {
  params: idParams,
  body: productInputSchema.extend({ rev: z.number().int().min(0) }).strict(),
} satisfies RequestValidationSchema;

export const remove = {
  params: idParams,
} satisfies RequestValidationSchema;

export const setPublished = {
  params: idParams,
  body: z.object({ isPublished: z.boolean(), rev: z.number().int().min(0) }).strict(),
} satisfies RequestValidationSchema;

export const reorder = {
  body: z.object({ categoryId: objectIdSchema, ids: z.array(objectIdSchema) }).strict(),
} satisfies RequestValidationSchema;
