import { Router } from "express";
import { validate } from "@utils/helper/zod";
import { requireAdmin, requireAuth } from "@utils/middleware/auth";

import * as controller from "@controllers/page/pageController";
import * as validator from "@controllers/page/validator";
// Importing the controller (which imports services.ts) is what actually
// registers the asset delete-protection usage-checker at startup — see
// services.ts. This router being mounted in routes/index.ts is what pulls
// the whole chain in.

const router = Router();

// Public — API_CONTRACT §4.3
router.get("/pages/:slug", validate(validator.getPublicPage), controller.getPublicPage);

// Admin — API_CONTRACT §4.3
const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);

adminRouter.get("/pages", controller.listAdminPages);
adminRouter.get("/pages/:slug", validate(validator.getAdminPage), controller.getAdminPage);
adminRouter.put(
  "/pages/:slug/sections/:key",
  validate(validator.putSection),
  controller.putSection
);
adminRouter.put("/pages/:slug/seo", validate(validator.putSeo), controller.putSeo);

router.use("/admin", adminRouter);

export default router;
