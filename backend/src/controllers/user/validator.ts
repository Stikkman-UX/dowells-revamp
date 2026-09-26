import { z } from "zod";
import { RequestValidationSchema } from "@utils/helper/zod";

const emailSchema = z.email().trim().toLowerCase();

// Login only checks the password was actually supplied — complexity rules
// belong to whatever sets/resets a password, not to every login attempt
// (there is no self-registration; admins only get a password via
// `npm run seed:admin`, which is not required to follow this policy).
const loginPasswordSchema = z
  .string()
  .min(1, "Password is required")
  .max(128, "Password is too long");

const newPasswordSchema = z
  .string()
  .trim()
  .min(6, "must be at least 6 characters")
  .max(64, "cannot exceed 64 characters")
  .regex(/[A-Z]/, "must contain at least one uppercase letter")
  .regex(/[0-9]/, "must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "must contain at least one special character");

export const login = {
  body: z
    .object({
      email: emailSchema,
      password: loginPasswordSchema,
    })
    .strict(),
} satisfies RequestValidationSchema;

// Not mounted (see routes/authRoutes.ts) — kept for a future phase.
export const forgotPassword = {
  body: z
    .object({
      email: emailSchema,
    })
    .strict(),
} satisfies RequestValidationSchema;

// Not mounted (see routes/authRoutes.ts) — kept for a future phase.
export const resetPassword = {
  params: z
    .object({
      token: z.string(),
    })
    .strict(),
  body: z
    .object({
      password: newPasswordSchema,
    })
    .strict(),
} satisfies RequestValidationSchema;
