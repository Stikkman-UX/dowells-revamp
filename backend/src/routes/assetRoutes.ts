import { Router } from "express";
import { validate } from "@utils/helper/zod";
import { requireAdmin, requireAuth } from "@utils/middleware/auth";
import { uploadRateLimiter } from "@utils/middleware/rateLimit";
import { uploadAsset as uploadAssetMiddleware } from "@utils/middleware/upload";

import * as controller from "@controllers/asset/assetController";
import * as validator from "@controllers/asset/validator";

const router = Router();

// API_CONTRACT §3 — /api/v1/admin/assets, Admin only. Upload and
// replace-in-place are the whole surface: there is no asset library, so
// nothing lists, fetches or deletes assets over HTTP.
router.use(requireAuth, requireAdmin);

router.post(
  "/",
  uploadRateLimiter,
  ...uploadAssetMiddleware,
  controller.uploadAsset
);

router.put(
  "/:assetId",
  uploadRateLimiter,
  validate(validator.paramsAssetId),
  ...uploadAssetMiddleware,
  controller.replaceAsset
);

export default router;
