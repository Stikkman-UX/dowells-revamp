import { Application } from "express";
import { verifyOrigin } from "@utils/middleware/csrf";

import authRoutes from "./authRoutes";
import assetRoutes from "./assetRoutes";
import pageRoutes from "./pageRoutes";
import categoryRoutes from "./categoryRoutes";
import productRoutes from "./productRoutes";

export default (app: Application) => {
  // CSRF (API_CONTRACT §1): applied to every non-GET/HEAD/OPTIONS request
  // under /api/v1, ahead of every resource router.
  app.use("/api/v1", verifyOrigin);

  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/admin/assets", assetRoutes);
  app.use("/api/v1", pageRoutes);
  app.use("/api/v1/admin/categories", categoryRoutes);
  app.use("/api/v1", productRoutes);
};
