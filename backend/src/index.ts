import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config();

import { connectDB } from "@config/database";
import { default as Routes } from "@routes/index";
import { RouteNotFound } from "@utils/error/errorInstances";
import { globalErrorHandler } from "@utils/error/errorHandler";
import httpLogger from "@utils/logger/httpLogger";
import { logError, logInfo } from "@utils/logger/logger";

const app = express();

// Behind the Next.js server (a reverse proxy) — needed so req.ip / req.secure
// reflect the real client and rate limiting isn't fooled.
app.set("trust proxy", 1);

app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: process.env.FRONT_END_URL,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
httpLogger(app);

Routes(app);

app.use((req: Request, _res: Response) => {
  throw new RouteNotFound(`Can't find ${req.originalUrl} on the server!`);
});

app.use(globalErrorHandler);

(async () => {
  try {
    await connectDB();
    logInfo(`[DB]: MongoDB Connected`);

    app.listen(process.env.PORT, () => {
      logInfo(`Application is running on port ${process.env.PORT}`);
    });
  } catch (error) {
    logError(error);
    process.exit(1);
  }
})();
