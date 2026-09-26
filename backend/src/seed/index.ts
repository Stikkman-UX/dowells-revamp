import dotenv from "dotenv";
dotenv.config();

import { spawnSync } from "child_process";
import mongoose from "mongoose";

import { connectDB } from "@config/database";
import { logError } from "@utils/logger/logger";

/**
 * Runs every seed script, in dependency order, ONLY when the database is
 * empty (no collection holds a single document). If anything is already
 * stored, nothing is seeded — this script only ever populates a fresh
 * database and never touches existing data.
 *
 * Usage:
 *   npm run seed
 *
 * Each step is the existing npm script (seed:admin → seed:home →
 * seed:products) run as its own process, so behaviour, defaults and env
 * handling are identical to running them by hand. Order matters: home and
 * products look up the admin user created by seed:admin.
 *
 * If a step fails, the remaining steps are not run. The database is then no
 * longer empty, so re-running this script will skip — finish the job by
 * running the failed step (and any after it) directly; each is idempotent.
 */

const SEED_STEPS = ["seed:admin", "seed:home", "seed:products"];

/** Returns the names of collections that contain at least one document. */
const findNonEmptyCollections = async (): Promise<string[]> => {
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database connection is not ready");

  const collections = await db.listCollections({}, { nameOnly: true }).toArray();
  const nonEmpty: string[] = [];

  for (const { name } of collections) {
    if (name.startsWith("system.")) continue;
    const count = await db.collection(name).countDocuments({}, { limit: 1 });
    if (count > 0) nonEmpty.push(name);
  }

  return nonEmpty;
};

const run = async () => {
  await connectDB();

  let nonEmpty: string[];
  try {
    nonEmpty = await findNonEmptyCollections();
  } finally {
    await mongoose.disconnect();
  }

  if (nonEmpty.length > 0) {
    console.log(
      `[seed] Database is not empty (data found in: ${nonEmpty.join(", ")}) — skipping seed.`
    );
    return;
  }

  console.log("[seed] Database is empty — running seed scripts.");

  for (const step of SEED_STEPS) {
    console.log(`\n[seed] ▶ npm run ${step}`);
    // shell: true so "npm" resolves to npm.cmd on Windows.
    const result = spawnSync("npm", ["run", step], { stdio: "inherit", shell: true });

    if (result.status !== 0) {
      console.error(
        `[seed] "${step}" failed (exit code ${result.status ?? "unknown"}). Remaining steps were not run.`
      );
      process.exitCode = result.status || 1;
      return;
    }
  }

  console.log("\n[seed] All seed scripts completed.");
};

run().catch((error) => {
  logError(error);
  console.error("[seed] Unexpected failure.", error);
  process.exitCode = 1;
});
