import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "@config/database";
import User from "@models/user/user";
import { EUserType } from "@models/user/interface";
import { hashString } from "@utils/helper/bcrypt";
import { logError, logInfo } from "@utils/logger/logger";
import mongoose from "mongoose";

/**
 * Idempotent upsert of the seed Admin user from ADMIN_SEED_EMAIL /
 * ADMIN_SEED_PASSWORD / ADMIN_SEED_NAME. There is no self-registration
 * endpoint by design — this script is the only way an Admin account is
 * created. Safe to re-run: it always converges the account for that email
 * to { name, password, userType: Admin } from the current env values.
 */
const run = async () => {
  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;
  const name = process.env.ADMIN_SEED_NAME;

  if (!email || !password || !name) {
    console.error(
      "[seed:admin] Missing one or more required env vars: ADMIN_SEED_EMAIL, ADMIN_SEED_PASSWORD, ADMIN_SEED_NAME. Set them in .env and try again."
    );
    process.exit(1);
  }

  await connectDB();

  try {
    const hashedPassword = await hashString(password);

    const admin = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      {
        $set: {
          name,
          email: email.toLowerCase(),
          password: hashedPassword,
          userType: EUserType.Admin,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    logInfo(`[seed:admin] Admin user ready: ${admin.email} (${admin._id})`);
    process.exitCode = 0;
  } catch (error) {
    logError(error);
    console.error("[seed:admin] Failed to seed admin user.", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();
