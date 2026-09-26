import { Router } from "express";
import { validate } from "@utils/helper/zod";
import { requireAdmin, requireAuth } from "@utils/middleware/auth";

import * as controller from "@controllers/category/categoryController";
import * as validator from "@controllers/category/validator";

// Admin only — API_CONTRACT §6.2, mounted at /api/v1/admin/categories.
// PUT /reorder is declared before PUT /:id so the literal "reorder" segment
// never gets swallowed by the :id param (which is also 422-validated as a
// 24-hex ObjectId, so "reorder" would otherwise fail that check).
const router = Router();
router.use(requireAuth, requireAdmin);

router.get("/", controller.listAdmin);
router.post("/", validate(validator.create), controller.create);
router.put("/reorder", validate(validator.reorder), controller.reorder);
router.put("/:id", validate(validator.update), controller.update);
router.delete("/:id", validate(validator.remove), controller.remove);

export default router;
