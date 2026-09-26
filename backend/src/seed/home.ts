import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import mongoose from "mongoose";

import { connectDB } from "@config/database";
import User from "@models/user/user";
import { ISeo } from "@models/page/interface";
import { ValidationFailed, OperationalError } from "@utils/error/errorInstances";
import { logError } from "@utils/logger/logger";
import { createSeedMediaContext, resolveSeedMedia } from "@src/seed/lib/seedMedia";

import { pageRegistry } from "@controllers/page/registry";
import * as services from "@controllers/page/services";

/**
 * Seeds initial content for registered pages from a JSON content file,
 * uploading any referenced media through AssetService.upload (the exact
 * same validation path — magic bytes / SVG content checks — as the HTTP
 * upload route) and writing sections/seo through the same service
 * functions the admin PUT endpoints use (so rev semantics and asset-aware
 * validation are identical).
 *
 * Usage:
 *   npm run seed:home -- --content <file.json> --assets-dir <dir> [--force]
 *
 * Defaults: --content ./seed/content.json, --assets-dir ../frontend/public
 * (both resolved relative to the current working directory, i.e. backend/
 * when run via the npm script).
 *
 * ---------------------------------------------------------------------
 * CONTENT FILE FORMAT (see backend/seed/content.sample.json for a worked
 * example):
 *
 * {
 *   "pages": {
 *     "<slug>": {                       // must be a slug in the page registry
 *       "seo"?: {                        // ignored for kind: "global" pages
 *         "title": string,
 *         "description": string,
 *         "canonical": string,
 *         "noindex": boolean,
 *         "ogImage": <Media|null>
 *       },
 *       "sections": {
 *         "<key>": <SectionData>          // must be a key registered for <slug>
 *       }
 *     }
 *   }
 * }
 *
 * Every "media" value (anywhere inside seo.ogImage or a section's data) is
 * written in this RESOLVED-LIKE form:
 *
 *   { "assetId": "", "alt": "...", "url": "/home/hero/slide-1.jpg",
 *     "mimeType": "image/jpeg", "fileType": "Image" }
 *
 * - assetId: "" (empty) + a root-relative "url" means "upload the file at
 *   <assets-dir><url> and use the resulting assetId". Identical file paths
 *   are only uploaded once per run (the assetId is reused for every other
 *   reference to the same url).
 * - assetId: "<existing-id>" means "reference this asset as-is" (url/
 *   mimeType/fileType, if present, are ignored — stripped just like the
 *   admin UI's round-tripped resolved media).
 * - A missing file on disk (or one that fails the same magic-byte/SVG
 *   validation the upload route enforces) is a WARNING, not a fatal error:
 *   that media value becomes null and seeding continues.
 * ---------------------------------------------------------------------
 *
 * Idempotent: a section/seo that has already been saved (rev > 0, or a seo
 * object that differs from the empty default) is left untouched — and
 * nothing is uploaded for it — unless --force is passed, in which case it
 * is re-validated and overwritten using its current rev.
 */

type ContentFile = {
  pages?: Record<
    string,
    {
      seo?: unknown;
      sections?: Record<string, unknown>;
    }
  >;
};

type CliArgs = { content: string; assetsDir: string; force: boolean };

const parseArgs = (argv: string[]): CliArgs => {
  const args: CliArgs = {
    content: "./seed/content.json",
    assetsDir: "../frontend/public",
    force: false,
  };

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--content" && argv[i + 1]) args.content = argv[++i];
    else if (argv[i] === "--assets-dir" && argv[i + 1]) args.assetsDir = argv[++i];
    else if (argv[i] === "--force") args.force = true;
  }

  return args;
};

const seoIsEmpty = (seo: ISeo | null): boolean =>
  !seo ||
  (seo.title === "" &&
    seo.description === "" &&
    seo.canonical === "" &&
    seo.noindex === false &&
    seo.ogImage === null);

const reportFailure = (label: string, error: unknown) => {
  if (error instanceof ValidationFailed) {
    console.error(`[seed:home] Validation failed for "${label}":`);
    for (const issue of error.errors) {
      console.error(`  - ${issue.path}: ${issue.message}`);
    }
  } else if (error instanceof OperationalError) {
    console.error(`[seed:home] "${label}" failed: ${error.message}`);
  } else {
    logError(error);
    console.error(`[seed:home] "${label}" failed with an unexpected error — see log above.`);
  }
};

const summary = {
  sectionsSeeded: 0,
  sectionsSkipped: 0,
  seoSeeded: 0,
  seoSkipped: 0,
};

const run = async () => {
  const args = parseArgs(process.argv.slice(2));
  const contentPath = path.resolve(process.cwd(), args.content);
  const assetsDir = path.resolve(process.cwd(), args.assetsDir);

  if (!fs.existsSync(contentPath)) {
    console.error(`[seed:home] Content file not found: ${contentPath}`);
    process.exit(1);
  }

  let raw: ContentFile;
  try {
    raw = JSON.parse(fs.readFileSync(contentPath, "utf-8")) as ContentFile;
  } catch (error) {
    console.error(`[seed:home] Content file is not valid JSON: ${contentPath}`, error);
    process.exit(1);
  }

  const pages = raw.pages;
  if (!pages || typeof pages !== "object") {
    console.error('[seed:home] Content file must have a top-level "pages" object.');
    process.exit(1);
  }

  const adminEmail = process.env.ADMIN_SEED_EMAIL;
  if (!adminEmail) {
    console.error("[seed:home] ADMIN_SEED_EMAIL is not set.");
    process.exit(1);
  }

  await connectDB();
  let exitCode = 0;
  const mediaCtx = createSeedMediaContext(assetsDir, "[seed:home]");

  try {
    const admin = await User.findOne({ email: adminEmail.toLowerCase() }).lean().exec();
    if (!admin) {
      console.error(
        `[seed:home] No user found for ADMIN_SEED_EMAIL=${adminEmail}. Run "npm run seed:admin" first.`
      );
      process.exitCode = 1;
      return;
    }
    const actorId = String(admin._id);

    for (const slug of Object.keys(pages)) {
      const definition = pageRegistry[slug];
      if (!definition) {
        console.warn(`[seed:home] "${slug}" is not a registered page — skipping.`);
        continue;
      }

      const pageContent = pages[slug];

      // --- seo -------------------------------------------------------
      if (pageContent.seo !== undefined) {
        if (definition.kind === "global") {
          console.warn(`[seed:home] "${slug}" has no seo (kind: global) — skipping seo.`);
        } else {
          const stored = await services.getStoredSeo(slug);
          const alreadySaved = !seoIsEmpty(stored);

          if (!args.force && alreadySaved) {
            summary.seoSkipped++;
          } else {
            try {
              const resolvedSeo = (await resolveSeedMedia(mediaCtx, pageContent.seo)) as unknown as ISeo;
              await services.putSeo({ slug, data: resolvedSeo, actorId });
              summary.seoSeeded++;
            } catch (error) {
              exitCode = 1;
              reportFailure(`${slug}.seo`, error);
            }
          }
        }
      }

      // --- sections ----------------------------------------------------
      const sections = pageContent.sections ?? {};
      for (const key of Object.keys(sections)) {
        if (!definition.sections[key]) {
          console.warn(`[seed:home] "${slug}.${key}" is not a registered section — skipping.`);
          continue;
        }

        const currentRev = await services.getSectionRev(slug, key);
        const alreadySaved = currentRev > 0;

        if (!args.force && alreadySaved) {
          summary.sectionsSkipped++;
          continue;
        }

        try {
          const resolvedData = await resolveSeedMedia(mediaCtx, sections[key]);
          await services.putSection({
            slug,
            key,
            isVisible: true,
            data: resolvedData,
            rev: currentRev,
            actorId,
          });
          summary.sectionsSeeded++;
        } catch (error) {
          exitCode = 1;
          reportFailure(`${slug}.${key}`, error);
        }
      }
    }
  } finally {
    console.log("\n[seed:home] Summary");
    console.log(
      `  sections — seeded: ${summary.sectionsSeeded}, skipped (already saved): ${summary.sectionsSkipped}`
    );
    console.log(
      `  seo      — seeded: ${summary.seoSeeded}, skipped (already saved): ${summary.seoSkipped}`
    );
    console.log(
      `  assets   — uploaded: ${mediaCtx.summary.assetsUploaded}, reused: ${mediaCtx.summary.assetsReused}, missing/invalid: ${mediaCtx.summary.assetsMissing}`
    );

    await mongoose.disconnect();
    process.exitCode = exitCode;
  }
};

run().catch((error) => {
  logError(error);
  console.error("[seed:home] Unexpected failure.", error);
  process.exitCode = 1;
});
