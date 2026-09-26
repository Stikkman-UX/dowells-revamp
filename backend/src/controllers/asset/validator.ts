import { z } from "zod";
import { RequestValidationSchema } from "@utils/helper/zod";

const assetIdSchema = z.string().trim().min(1).max(200);

export const paramsAssetId = {
  params: z.object({ assetId: assetIdSchema }).strict(),
} satisfies RequestValidationSchema;
