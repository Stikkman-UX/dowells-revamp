import { Request, Response, NextFunction } from "express";
import { EUserType } from "@models/user/interface";
import { MESSAGES, STATUS_CODES } from "@src/constants";
import { verifyAccessToken } from "@utils/helper/generateToken";
import { OperationalError } from "@utils/error/errorInstances";

/**
 * Reads the `accessToken` cookie, verifies it, and populates
 * req.userId / req.userType. 401 when the cookie is missing or invalid.
 */
export const requireAuth = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const accessToken = req.cookies?.accessToken;

  if (!accessToken) {
    return next(
      new OperationalError(STATUS_CODES.AUTH_FAILED, MESSAGES.notAuthenticated)
    );
  }

  try {
    const payload = verifyAccessToken(accessToken);

    if (!payload?.user?._id) {
      return next(
        new OperationalError(STATUS_CODES.AUTH_FAILED, MESSAGES.invalidToken)
      );
    }

    req.userId = String(payload.user._id);
    req.userType = payload.user.userType;

    next();
  } catch {
    return next(
      new OperationalError(STATUS_CODES.AUTH_FAILED, MESSAGES.invalidToken)
    );
  }
};

/** 403 unless the authenticated user is an Admin. Must run after requireAuth. */
export const requireAdmin = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  if (req.userType !== EUserType.Admin) {
    return next(
      new OperationalError(STATUS_CODES.FORBIDDEN, MESSAGES.not_allowed)
    );
  }

  next();
};
