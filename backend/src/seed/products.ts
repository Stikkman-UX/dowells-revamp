import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import mongoose from "mongoose";

import { connectDB } from "@config/database";
import User from "@models/user/user";
import Category from "@models/category/category";
import Product from "@models/product/product";
import { MESSAGES, STATUS_CODES } from "@src/constants";
import { ValidationFailed, ValidationIssue, OperationalError } from "@utils/error/errorInstances";
import { logError } from "@utils/logger/logger";
import { createSeedMediaContext, resolveSeedMedia } from "@src/seed/lib/seedMedia";

import { categoryInputSchema, CategoryInputData } from "@controllers/category/validator";
import * as categoryServices from "@controllers/category/services";
import { productInputSchema, productDefaults, ProductInputData } from "@controllers/product/schema";
import * as productServices from "@controllers/product/services";

/**
 * Seeds sample Categories/Products from a hand-written JSON fixture,
 * uploading referenced media through AssetService.upload (via the shared
 * seedMedia helpers, also used by seed:home) and writing through the exact
 * same category/product service functions the admin HTTP endpoints use —
 * so zod validation, asset-aware validation and rev semantics are
 * identical to a real admin save.
 *
 * Usage:
 *   npm run seed:products -- --content <file.json> --assets-dir <dir> [--force]
 *
 * Defaults: --content ./seed/products.json, --assets-dir ../frontend/public
 * (both resolved relative to the current working directory, i.e. backend/
 * when run via the npm script).
 *
 * ---------------------------------------------------------------------
 * CONTENT FILE FORMAT (see backend/seed/products.json):
 *
 * {
 *   "categories": [
 *     {
 *       "name": string, "slug": string, "description": string,
 *       "products": [ <ProductInput minus categoryId> ]
 *     }
 *   ]
 * }
 *
 * Every media value is written in the same RESOLVED-LIKE stub form
 * seed:home uses: { "assetId": "", "alt": "...", "url": "..." }. The "url"
 * may be a root-relative local path (resolved under --assets-dir) or an
 * absolute http(s):// URL (e.g. a dummyimage.com placeholder), fetched and
 * type-detected the same way as a local file upload. A file that is
 * missing, invalid, or fails to fetch is a WARNING, not a fatal error —
 * that media value becomes null (every Media field in the product schema
 * is nullable) and the product still seeds.
 *
 * Idempotent by slug: a category that already exists (by slug) or a
 * product that already exists (by categoryId + slug) is left untouched —
 * and nothing is uploaded for its media — unless --force is passed, in
 * which case it is re-validated and overwritten using its current rev.
 * ---------------------------------------------------------------------
 */

type ProductsContentFile = {
  categories?: Array<{
    name?: unknown;
    slug?: unknown;
    description?: unknown;
    products?: unknown[];
  }>;
};

type CliArgs = { content: string; assetsDir: string; force: boolean };

const parseArgs = (argv: string[]): CliArgs => {
  const args: CliArgs = {
    content: "./seed/products.json",
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

const reportFailure = (label: string, error: unknown) => {
  if (error instanceof ValidationFailed) {
    console.error(`[seed:products] Validation failed for "${label}":`);
    for (const issue of error.errors) {
      console.error(`  - ${issue.path}: ${issue.message}`);
    }
  } else if (error instanceof OperationalError) {
    console.error(`[seed:products] "${label}" failed: ${error.message}`);
  } else {
    logError(error);
    console.error(`[seed:products] "${label}" failed with an unexpected error — see log above.`);
  }
};

/** Mirrors src/utils/helper/zod.ts's path-joining so a local schema failure
 *  reports paths identically to the HTTP validate() middleware. */
const zodIssuesToValidationFailed = (
  issues: { path: PropertyKey[]; message: string }[],
  fallbackPath: string
): ValidationFailed => {
  const mapped: ValidationIssue[] = issues.map((issue) => ({
    path: issue.path.length ? issue.path.map(String).join(".") : fallbackPath,
    message: issue.message,
  }));
  return new ValidationFailed(STATUS_CODES.VALIDATION_FAILED, MESSAGES.validationFailed, mapped);
};

const summary = {
  categoriesCreated: 0,
  categoriesUpdated: 0,
  categoriesSkipped: 0,
  productsCreated: 0,
  productsUpdated: 0,
  productsSkipped: 0,
  failures: 0,
};

const run = async () => {
  const args = parseArgs(process.argv.slice(2));
  const contentPath = path.resolve(process.cwd(), args.content);
  const assetsDir = path.resolve(process.cwd(), args.assetsDir);

  if (!fs.existsSync(contentPath)) {
    console.error(`[seed:products] Content file not found: ${contentPath}`);
    process.exit(1);
  }

  let raw: ProductsContentFile;
  try {
    raw = JSON.parse(fs.readFileSync(contentPath, "utf-8")) as ProductsContentFile;
  } catch (error) {
    console.error(`[seed:products] Content file is not valid JSON: ${contentPath}`, error);
    process.exit(1);
  }

  const categoriesInput = raw.categories;
  if (!Array.isArray(categoriesInput)) {
    console.error('[seed:products] Content file must have a top-level "categories" array.');
    process.exit(1);
  }

  const adminEmail = process.env.ADMIN_SEED_EMAIL;
  if (!adminEmail) {
    console.error("[seed:products] ADMIN_SEED_EMAIL is not set.");
    process.exit(1);
  }

  await connectDB();
  let exitCode = 0;
  const mediaCtx = createSeedMediaContext(assetsDir, "[seed:products]");

  try {
    const admin = await User.findOne({ email: adminEmail.toLowerCase() }).lean().exec();
    if (!admin) {
      console.error(
        `[seed:products] No user found for ADMIN_SEED_EMAIL=${adminEmail}. Run "npm run seed:admin" first.`
      );
      process.exitCode = 1;
      return;
    }
    const actorId = String(admin._id);

    for (const categoryEntry of categoriesInput) {
      const { products: productsRaw, ...categoryFields } = categoryEntry;
      const categoryLabel =
        typeof categoryFields.slug === "string" ? categoryFields.slug : JSON.stringify(categoryFields);

      let categoryInput: CategoryInputData;
      const categoryParse = categoryInputSchema.strict().safeParse(categoryFields);
      if (!categoryParse.success) {
        exitCode = 1;
        summary.failures++;
        reportFailure(categoryLabel, zodIssuesToValidationFailed(categoryParse.error.issues, "body"));
        continue; // no valid categoryId — skip its products too
      }
      categoryInput = categoryParse.data;

      let categoryId: string;

      try {
        const existing = await Category.findOne({ slug: categoryInput.slug }).lean().exec();

        if (!existing) {
          const created = await categoryServices.create(categoryInput, actorId);
          categoryId = created._id;
          summary.categoriesCreated++;
        } else if (args.force) {
          const updated = await categoryServices.update(
            String(existing._id),
            categoryInput,
            existing.rev,
            actorId
          );
          categoryId = updated._id;
          summary.categoriesUpdated++;
        } else {
          categoryId = String(existing._id);
          summary.categoriesSkipped++;
        }
      } catch (error) {
        exitCode = 1;
        summary.failures++;
        reportFailure(categoryLabel, error);
        continue; // category write failed — skip its products too
      }

      const products = Array.isArray(productsRaw) ? productsRaw : [];

      for (const productRaw of products) {
        const rawSlug =
          isPlainObject(productRaw) && typeof productRaw.slug === "string" ? productRaw.slug : undefined;
        const productLabel = rawSlug ? `${categoryInput.slug}/${rawSlug}` : `${categoryInput.slug}/<unknown>`;

        try {
          // Existence is checked BEFORE any media is resolved: a
          // never-saved product's placeholders are uploaded once, but a
          // product that already exists (and --force wasn't passed) is
          // skipped without touching AssetService at all — the second run
          // of this script must upload nothing.
          const existingProduct = rawSlug
            ? await Product.findOne({ categoryId, slug: rawSlug }).lean().exec()
            : null;

          if (existingProduct && !args.force) {
            summary.productsSkipped++;
            continue;
          }

          // Upload media once per run (before merging with defaults so
          // every media stub in the hand-written JSON is resolved).
          const resolvedProduct = (await resolveSeedMedia(mediaCtx, productRaw)) as Record<
            string,
            unknown
          >;

          const candidate: unknown = {
            ...productDefaults(categoryId),
            ...resolvedProduct,
            categoryId,
          };

          const productParse = productInputSchema.strict().safeParse(candidate);
          if (!productParse.success) {
            exitCode = 1;
            summary.failures++;
            reportFailure(
              productLabel,
              zodIssuesToValidationFailed(productParse.error.issues, "body")
            );
            continue;
          }

          const input: ProductInputData = productParse.data;

          if (!existingProduct) {
            await productServices.create(input, actorId);
            summary.productsCreated++;
          } else {
            await productServices.update(String(existingProduct._id), input, existingProduct.rev, actorId);
            summary.productsUpdated++;
          }
        } catch (error) {
          exitCode = 1;
          summary.failures++;
          reportFailure(productLabel, error);
        }
      }
    }
  } finally {
    console.log("\n[seed:products] Summary");
    console.log(
      `  categories — created: ${summary.categoriesCreated}, updated: ${summary.categoriesUpdated}, skipped (already saved): ${summary.categoriesSkipped}`
    );
    console.log(
      `  products   — created: ${summary.productsCreated}, updated: ${summary.productsUpdated}, skipped (already saved): ${summary.productsSkipped}`
    );
    console.log(
      `  assets     — uploaded: ${mediaCtx.summary.assetsUploaded}, reused: ${mediaCtx.summary.assetsReused}, missing/invalid (set to null, product still seeded): ${mediaCtx.summary.assetsMissing}`
    );
    console.log(`  failures   — ${summary.failures}`);

    await mongoose.disconnect();
    process.exitCode = summary.failures > 0 ? 1 : exitCode;
  }
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

run().catch((error) => {
  logError(error);
  console.error("[seed:products] Unexpected failure.", error);
  process.exitCode = 1;
});
