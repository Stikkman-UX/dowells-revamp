import { Router } from "express";
import { validate } from "@utils/helper/zod";
import { requireAuth } from "@utils/middleware/auth";
import { authIpRateLimiter, loginRateLimiter } from "@utils/middleware/rateLimit";

import * as controller from "@controllers/user/userController";
import * as validator from "@controllers/user/validator";

const router = Router();

// API_CONTRACT §2 — /api/v1/auth
router.post(
  "/login",
  authIpRateLimiter,
  loginRateLimiter,
  validate(validator.login),
  controller.login
);
router.post("/refresh", authIpRateLimiter, controller.refresh);
router.post("/logout", authIpRateLimiter, controller.logout);
router.get("/me", authIpRateLimiter, requireAuth, controller.me);

// Google OAuth and forgot/reset-password are implemented in the controller
// but intentionally NOT mounted here — out of scope for this phase and not
// part of API_CONTRACT. See userController.ts / services.ts for the code.

export default router;
