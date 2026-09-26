import jwt, { JwtPayload } from "jsonwebtoken";
import { EUserType } from "@models/user/interface";

// A minimal, JSON-serializable shape (not a Mongoose Document) — this is
// exactly what round-trips through a signed JWT.
export type TokenUser = { _id: string; userType: EUserType };

export interface AccessTokenPayload extends JwtPayload {
  user: TokenUser;
}

// jsonwebtoken's `expiresIn` is in SECONDS when numeric (ms was a long-standing
// bug here that silently made tokens live ~250x longer than intended).
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

const getAccessSecret = (): string => {
  const secret = process.env.JWT_ACCESS_TOKEN_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_TOKEN_SECRET is not set");
  return secret;
};

const getRefreshSecret = (): string => {
  const secret = process.env.JWT_REFRESH_TOKEN_SECRET;
  if (!secret) throw new Error("JWT_REFRESH_TOKEN_SECRET is not set");
  return secret;
};

export const generateAccessToken = (user: TokenUser): string => {
  return jwt.sign({ user }, getAccessSecret(), {
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  });
};

export const generateRefreshToken = (user: TokenUser): string => {
  return jwt.sign({ user }, getRefreshSecret(), {
    expiresIn: REFRESH_TOKEN_TTL_SECONDS,
  });
};

export const generateToken = async (
  user: TokenUser
): Promise<{ accessToken: string; refreshToken: string }> => {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
  };
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, getAccessSecret()) as AccessTokenPayload;
};

export const verifyRefreshToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, getRefreshSecret()) as AccessTokenPayload;
};
