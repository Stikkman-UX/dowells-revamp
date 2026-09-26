import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { Request, Response, NextFunction } from "express";
import { MESSAGES, STATUS_CODES } from "@src/constants";
import { OperationalError } from "@utils/error/errorInstances";

const tooManyRequestsHandler = (
  _req: Request,
  _res: Response,
  next: NextFunction
) => {
  next(
    new OperationalError(STATUS_CODES.TOO_MANY_REQUESTS, MESSAGES.tooManyRequests)
  );
};

/**
 * Every request to this API comes from the Next.js server (it proxies the
 * browser), so every request shares the same source IP — keying by IP alone
 * would let one attacker lock out every real admin behind that IP. Login is
 * instead rate-limited per lowercased email, which is what actually matters
 * for a credential-stuffing / brute-force defence.
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  // Brute-force protection counts failures only; successful logins must not
  // be able to lock a legitimate admin out.
  skipSuccessfulRequests: true,
  keyGenerator: (req: Request) => {
    const email = req.body?.email;
    return typeof email === "string" && email.trim()
      ? email.trim().toLowerCase()
      : ipKeyGenerator(req.ip ?? "unknown");
  },
  handler: tooManyRequestsHandler,
});

/** Looser, IP-keyed backstop against blunt floods on the auth routes. */
export const authIpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: tooManyRequestsHandler,
});

/**
 * Asset uploads (POST/PUT /admin/assets) are authenticated admin-only
 * routes, but — same as login — every request still arrives from the
 * Next.js server's IP, so this is keyed by the authenticated admin's userId
 * (set by requireAuth, which must run before this) instead of IP.
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.userId ?? ipKeyGenerator(req.ip ?? "unknown"),
  handler: tooManyRequestsHandler,
});
