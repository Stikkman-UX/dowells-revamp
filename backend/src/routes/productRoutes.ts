import { Router } from "express";
import { validate } from "@utils/helper/zod";
import { requireAdmin, requireAuth } from "@utils/middleware/auth";

import * as controller from "@controllers/product/productController";
import * as validator from "@controllers/product/validator";

// API_CONTRACT §6.2 — mounted at /api/v1 (public /products/... routes) with
// an admin sub-router at /admin/products.
const router = Router();

// Public. "/products/categories" MUST be declared before
// "/products/:categorySlug/:productSlug", or the literal "categories"
// segment would be captured as :categorySlug instead.
router.get("/products/categories", controller.listPublicCategories);
router.get(
  "/products/:categorySlug/:productSlug",
  validate(validator.getPublicProduct),
  controller.getPublicProduct
);

// Admin.
const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);

adminRouter.get("/", validate(validator.listAdmin), controller.listAdmin);
adminRouter.post("/", validate(validator.create), controller.create);
// PUT /reorder before /:id — same reasoning as categoryRoutes.ts.
adminRouter.put("/reorder", validate(validator.reorder), controller.reorder);
adminRouter.get("/:id", validate(validator.getAdmin), controller.getAdmin);
adminRouter.put("/:id", validate(validator.update), controller.update);
adminRouter.put("/:id/publish", validate(validator.setPublished), controller.setPublished);
adminRouter.delete("/:id", validate(validator.remove), controller.remove);

router.use("/admin/products", adminRouter);

export default router;
