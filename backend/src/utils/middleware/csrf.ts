import { Request, Response, NextFunction } from "express";
import { OperationalError } from "@utils/error/errorInstances";
import { MESSAGES, STATUS_CODES } from "@src/constants";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * API_CONTRACT §1 "CSRF (all non-GET requests)":
 * - Origin header host must equal the host of FRONT_END_URL, else 403.
 * - Header X-Requested-With: XMLHttpRequest is required, else 403.
 *
 * The browser never talks to this backend directly (Next.js rewrites proxy
 * the request), so this is the only CSRF defence we have: a cross-site form
 * post cannot set a custom header, and cannot forge our Origin.
 */
export const verifyOrigin = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  const frontEndUrl = process.env.FRONT_END_URL;
  const origin = req.headers.origin;
  const requestedWith = req.headers["x-requested-with"];

  let expectedHost: string | null = null;
  try {
    expectedHost = frontEndUrl ? new URL(frontEndUrl).host : null;
  } catch {
    expectedHost = null;
  }

  let originHost: string | null = null;
  try {
    originHost = origin ? new URL(origin).host : null;
  } catch {
    originHost = null;
  }

  if (!expectedHost || !originHost || originHost !== expectedHost) {
    return next(
      new OperationalError(STATUS_CODES.FORBIDDEN, MESSAGES.csrfFailed)
    );
  }

  if (requestedWith !== "XMLHttpRequest") {
    return next(
      new OperationalError(STATUS_CODES.FORBIDDEN, MESSAGES.csrfFailed)
    );
  }

  next();
};
