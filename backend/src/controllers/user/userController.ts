import { Request, Response } from "express";
import { asyncErrorHandler } from "@utils/asyncHandler/asyncHandler";
import { MESSAGES, STATUS_CODES } from "@src/constants";
import { OperationalError } from "@utils/error/errorInstances";
import {
  generateAccessToken,
  generateToken,
  verifyRefreshToken,
} from "@utils/helper/generateToken";

import { clearSession, setAccessTokenCookie, setSession } from "./helper";
import * as services from "./services";

export const login = asyncErrorHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await services.login({ email, password });

  const { accessToken, refreshToken } = await generateToken({
    _id: user._id,
    userType: user.userType,
  });

  setSession(res, accessToken, refreshToken);

  return res.status(STATUS_CODES.SUCCESS).json({
    message: MESSAGES.success,
    data: { user },
  });
});

export const refresh = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const token = req.cookies?.refreshToken;

    if (!token) {
      throw new OperationalError(
        STATUS_CODES.AUTH_FAILED,
        MESSAGES.notAuthenticated
      );
    }

    let userId: string;
    try {
      const payload = verifyRefreshToken(token);
      userId = String(payload.user._id);
    } catch {
      throw new OperationalError(
        STATUS_CODES.AUTH_FAILED,
        MESSAGES.invalidToken
      );
    }

    const user = await services.getUserById(userId);
    const accessToken = generateAccessToken({
      _id: user._id,
      userType: user.userType,
    });

    setAccessTokenCookie(res, accessToken);

    return res.status(STATUS_CODES.SUCCESS).json({
      message: MESSAGES.success,
      data: { user },
    });
  }
);

export const logout = asyncErrorHandler(
  async (_req: Request, res: Response) => {
    clearSession(res);

    return res.status(STATUS_CODES.SUCCESS).json({
      message: MESSAGES.success,
    });
  }
);

export const me = asyncErrorHandler(async (req: Request, res: Response) => {
  const user = await services.getUserById(req.userId as string);

  return res.status(STATUS_CODES.SUCCESS).json({
    message: MESSAGES.success,
    data: { user },
  });
});

// --- Google OAuth / password reset ------------------------------------
// Kept but intentionally NOT mounted in routes/authRoutes.ts: out of scope
// for this phase, not part of API_CONTRACT. Left in place for later.
export const handleGoogleAuth = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const code = req.query.code as string;
    const stateParam = req.query.state as string;

    let redirectPath = "/";
    try {
      const parsed = JSON.parse(stateParam);
      const from = parsed.from as string;
      // Only allow relative paths to prevent open redirect
      if (from && from.startsWith("/")) {
        redirectPath = from;
      }
    } catch {
      // state was plain string (old format), ignore
    }

    if (!code) {
      return res
        .status(STATUS_CODES.ACTION_FAILED)
        .json({ message: "Failed auth" });
    }

    let user;
    try {
      user = await services.loginWithGoogle(code, req);
    } catch (err: any) {
      const message = err?.message || "Google login failed";
      return res.redirect(
        `${process.env.FRONT_END_URL || "http://localhost:3000"}/login?error=${encodeURIComponent(message)}`
      );
    }

    const { accessToken, refreshToken } = await generateToken({
      _id: user._id,
      userType: user.userType,
    });
    setSession(res, accessToken, refreshToken);

    return res.redirect(
      `${process.env.FRONT_END_URL || "http://localhost:3000"}${redirectPath}`
    );
  }
);

export const forgotPassword = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const result = await services.forgotPassword(req.body.email);

    return res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: MESSAGES.success, data: result });
  }
);

export const resetPassword = asyncErrorHandler(
  async (req: Request, res: Response) => {
    const result = await services.resetPassword(
      req.params.token,
      req.body.password
    );

    return res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: MESSAGES.success, data: result });
  }
);
