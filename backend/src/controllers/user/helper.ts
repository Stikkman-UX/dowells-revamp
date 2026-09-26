import { Response, CookieOptions } from "express";
import qs from "qs";
import axios from "axios";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
} from "@utils/helper/generateToken";

/**
 * Single source of truth for auth cookie options (API_CONTRACT §1 "Auth cookies").
 * `secure` is only enabled in production because local/dev over plain HTTP
 * would otherwise silently drop the cookie. No `Domain` — host-only cookies,
 * since the browser only ever talks to the Next.js origin (rewrites proxy to
 * this backend), never to this API's own host.
 */
const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  secure: process.env.ENVIRONMENT === "production",
};

export const accessTokenCookieOptions = (): CookieOptions => ({
  ...baseCookieOptions,
  maxAge: ACCESS_TOKEN_TTL_SECONDS * 1000,
});

export const refreshTokenCookieOptions = (): CookieOptions => ({
  ...baseCookieOptions,
  maxAge: REFRESH_TOKEN_TTL_SECONDS * 1000,
});

export const setAccessTokenCookie = (res: Response, accessToken: string) => {
  res.cookie("accessToken", accessToken, accessTokenCookieOptions());
};

export const setRefreshTokenCookie = (res: Response, refreshToken: string) => {
  res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions());
};

export const setSession = (
  res: Response,
  accessToken: string,
  refreshToken?: string
) => {
  setAccessTokenCookie(res, accessToken);

  if (refreshToken) {
    setRefreshTokenCookie(res, refreshToken);
  }
};

/** Clears both cookies with the exact same attributes they were set with. */
export const clearSession = (res: Response) => {
  res.clearCookie("accessToken", baseCookieOptions);
  res.clearCookie("refreshToken", baseCookieOptions);
};

// --- Google OAuth ------------------------------------------------------
// Kept but intentionally NOT mounted (see routes/authRoutes.ts): out of scope
// for this phase per the task brief, and API_CONTRACT has no /auth/google
// endpoint. Left in place for a future phase to wire up.
export const getGoogleOAuthToken = async ({ code }: { code: string }) => {
  const URL = `https://oauth2.googleapis.com/token`;

  const values = {
    code,
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
    client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URL,
    grant_type: "authorization_code",
  };

  const response = await axios.post(URL, qs.stringify(values), {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  return response.data;
};
