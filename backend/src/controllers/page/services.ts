import { Types } from "mongoose";
import Page from "@models/page/page";
import { ISeo, IStoredMediaRef } from "@models/page/interface";
import { OperationalError, ValidationFailed, ValidationIssue } from "@utils/error/errorInstances";
import { MESSAGES, STATUS_CODES } from "@src/constants";
import { logError } from "@utils/logger/logger";
import * as assetService from "@controllers/asset/assetService";

import { getPageDefinition, getSectionDefinition, pageRegistry, registeredSlugs } from "./registry";
import { emptySeo, seoSchema } from "./sections/shared.schema";
import { collectAssetIssues, collectMediaRefs, loadAssetMap, resolveMedia } from "./mediaRefs";

/**
 * Business logic for the page-generic CMS (API_CONTRACT §4). Nothing in
 * this file references "home" or any other concrete slug — it only ever
 * works off `pageRegistry` plus whatever slug/key the caller passes in.
 */

// ---- lean read shapes ------------------------------------------------------
// `.lean()` returns the raw driver document — Map-typed schema fields come
// back as plain objects, not Map instances — so these mirror that shape
// rather than IPage/IPageSection (which describe the hydrated document).

type LeanSection = {
  isVisible: boolean;
  data: unknown;
  rev: number;
  updatedAt: Date;
};

type LeanSeo = {
  title: string;
  description: string;
  canonical: string;
  noindex: boolean;
  ogImage: IStoredMediaRef | null;
};

type LeanPage = {
  slug: string;
  seo: LeanSeo;
  sections: Record<string, LeanSection> | Map<string, LeanSection> | undefined;
  updatedAt: Date;
};

/** Defensive against either shape (plain object from `.lean()`, or a real
 *  Map if that ever changes) rather than assuming one or the other. */
const readSection = (
  sections: LeanPage["sections"],
  key: string
): LeanSection | undefined => {
  if (!sections) return undefined;
  if (sections instanceof Map) return sections.get(key);
  return sections[key];
};

// ---- response shapes (API_CONTRACT §4.3) ----------------------------------

export type ResolvedSeo = {
  title: string;
  description: string;
  canonical: string;
  noindex: boolean;
  ogImage: unknown; // ResolvedMedia | null
};

export type PublicSection = { isVisible: true; data: unknown } | { isVisible: false };

export type AdminSection = {
  isVisible: boolean;
  data: unknown;
  rev: number;
  updatedAt: string | null;
};

export type PublicPageResponse = {
  slug: string;
  title: string;
  seo: ResolvedSeo;
  sections: Record<string, PublicSection>;
  updatedAt: string | null;
};

export type AdminPageListItem = {
  slug: string;
  title: string;
  kind: "page" | "global";
  path: string | null;
  sectionKeys: string[];
  updatedAt: string | null;
};

export type AdminPageResponse = {
  slug: string;
  title: string;
  kind: "page" | "global";
  path: string | null;
  seo: ResolvedSeo;
  sections: Record<string, AdminSection>;
  updatedAt: string | null;
};

// ---- helpers ---------------------------------------------------------------

const collectAllAssetIds = (values: unknown[], seoOgImage?: IStoredMediaRef | null): string[] => {
  const ids = new Set<string>();
  for (const value of values) {
    for (const ref of collectMediaRefs(value)) ids.add(ref.assetId);
  }
  if (seoOgImage?.assetId) ids.add(seoOgImage.assetId);
  return Array.from(ids);
};

// ---- public read (API_CONTRACT §4.3 GET /pages/:slug) --------------------

export const getPublicPage = async (slug: string): Promise<PublicPageResponse> => {
  const definition = getPageDefinition(slug); // 404 pageNotFound

  const doc = await Page.findOne({ slug }).lean<LeanPage | null>().exec();

  if (!doc) {
    return {
      slug,
      title: definition.title,
      seo: emptySeo(),
      sections: {},
      updatedAt: null,
    };
  }

  const storedValues: unknown[] = [];
  for (const key of Object.keys(definition.sections)) {
    const stored = readSection(doc.sections, key);
    if (stored?.isVisible) storedValues.push(stored.data);
  }

  const assetMap = await assetService.getMany(collectAllAssetIds(storedValues, doc.seo?.ogImage));

  const sections: Record<string, PublicSection> = {};

  for (const key of Object.keys(definition.sections)) {
    const stored = readSection(doc.sections, key);
    if (!stored) continue; // never saved — frontend falls back to its own defaults

    if (!stored.isVisible) {
      sections[key] = { isVisible: false };
      continue;
    }

    const parsed = definition.sections[key].schema.safeParse(stored.data);
    if (!parsed.success) {
      // A stored section that no longer matches its schema (e.g. after a
      // schema change) must not take the whole page down — omit and log.
      logError({
        scope: "pages.getPublicPage",
        slug,
        key,
        issues: parsed.error.issues,
      });
      continue;
    }

    sections[key] = { isVisible: true, data: resolveMedia(parsed.data, assetMap) };
  }

  return {
    slug,
    title: definition.title,
    seo: resolveMedia(doc.seo ?? emptySeo(), assetMap) as ResolvedSeo,
    sections,
    updatedAt: doc.updatedAt.toISOString(),
  };
};

// ---- admin reads (API_CONTRACT §4.3) --------------------------------------

export const listAdminPages = async (): Promise<AdminPageListItem[]> => {
  const docs = await Page.find(
    { slug: { $in: registeredSlugs } },
    { slug: 1, updatedAt: 1 }
  )
    .lean<{ slug: string; updatedAt: Date }[]>()
    .exec();

  const updatedAtBySlug = new Map(docs.map((doc) => [doc.slug, doc.updatedAt]));

  return registeredSlugs.map((slug) => {
    const definition = pageRegistry[slug];
    const updatedAt = updatedAtBySlug.get(slug);

    return {
      slug,
      title: definition.title,
      kind: definition.kind,
      path: definition.path,
      sectionKeys: Object.keys(definition.sections),
      updatedAt: updatedAt ? updatedAt.toISOString() : null,
    };
  });
};

export const getAdminPage = async (slug: string): Promise<AdminPageResponse> => {
  const definition = getPageDefinition(slug); // 404 pageNotFound

  const doc = await Page.findOne({ slug }).lean<LeanPage | null>().exec();

  const storedValues: unknown[] = [];
  for (const key of Object.keys(definition.sections)) {
    const stored = readSection(doc?.sections, key);
    if (stored) storedValues.push(stored.data);
  }

  const assetMap = await assetService.getMany(collectAllAssetIds(storedValues, doc?.seo?.ogImage));

  const sections: Record<string, AdminSection> = {};

  for (const key of Object.keys(definition.sections)) {
    const stored = readSection(doc?.sections, key);

    if (!stored) {
      sections[key] = {
        isVisible: true,
        data: definition.sections[key].defaults(),
        rev: 0,
        updatedAt: null,
      };
      continue;
    }

    sections[key] = {
      isVisible: stored.isVisible,
      data: resolveMedia(stored.data, assetMap),
      rev: stored.rev,
      updatedAt: stored.updatedAt.toISOString(),
    };
  }

  return {
    slug,
    title: definition.title,
    kind: definition.kind,
    path: definition.path,
    seo: resolveMedia(doc?.seo ?? emptySeo(), assetMap) as ResolvedSeo,
    sections,
    updatedAt: doc?.updatedAt ? doc.updatedAt.toISOString() : null,
  };
};

// ---- writes (API_CONTRACT §4.3 PUT .../sections/:key, PUT .../seo) -------

export type PutSectionInput = {
  slug: string;
  key: string;
  isVisible: boolean;
  data: unknown;
  rev: number;
  actorId: string;
};

export const putSection = async ({
  slug,
  key,
  isVisible,
  data,
  rev,
  actorId,
}: PutSectionInput): Promise<AdminSection> => {
  // Guards slug AND key against the registry before either is ever used to
  // build a Mongo dotted path (no injection via :key — see registry.ts).
  const sectionDef = getSectionDefinition(slug, key);

  const parseResult = sectionDef.schema.safeParse(data);
  if (!parseResult.success) {
    const issues: ValidationIssue[] = parseResult.error.issues.map((issue) => {
      const suffix = issue.path.map(String).join(".");
      return { path: suffix ? `data.${suffix}` : "data", message: issue.message };
    });
    throw new ValidationFailed(STATUS_CODES.VALIDATION_FAILED, MESSAGES.validationFailed, issues);
  }

  const parsedData = parseResult.data;
  const assetMap = await loadAssetMap([parsedData]);

  const assetIssues = collectAssetIssues(parsedData, assetMap, "data.");
  if (assetIssues.length) {
    throw new ValidationFailed(STATUS_CODES.VALIDATION_FAILED, MESSAGES.validationFailed, assetIssues);
  }

  // Ensure the page document exists without ever touching an existing one's
  // fields (only $setOnInsert), then do the actual write as a single atomic,
  // revision-guarded findOneAndUpdate. A plain $set is safe even though
  // section data legitimately contains strings starting with "$" (e.g.
  // "$5,000") — that's only a hazard for aggregation-pipeline updates, which
  // this deliberately never uses.
  await Page.updateOne(
    { slug },
    { $setOnInsert: { slug } },
    { upsert: true, setDefaultsOnInsert: true }
  );

  const orConditions: Record<string, unknown>[] = [{ [`sections.${key}.rev`]: rev }];
  if (rev === 0) {
    orConditions.push({ [`sections.${key}`]: { $exists: false } });
  }

  const now = new Date();
  const nextRev = rev + 1;

  const updated = await Page.findOneAndUpdate(
    { slug, $or: orConditions },
    {
      $set: {
        [`sections.${key}`]: {
          isVisible,
          data: parsedData,
          rev: nextRev,
          updatedAt: now,
        },
        updatedBy: new Types.ObjectId(actorId),
      },
    },
    { new: true }
  )
    .lean()
    .exec();

  if (!updated) {
    throw new OperationalError(STATUS_CODES.CONFLICT, MESSAGES.staleRevision);
  }

  return {
    isVisible,
    data: resolveMedia(parsedData, assetMap),
    rev: nextRev,
    updatedAt: now.toISOString(),
  };
};

export type PutSeoInput = {
  slug: string;
  data: ISeo;
  actorId: string;
};

export const putSeo = async ({ slug, data, actorId }: PutSeoInput): Promise<ResolvedSeo> => {
  const definition = getPageDefinition(slug); // 404 pageNotFound

  if (definition.kind === "global") {
    throw new OperationalError(STATUS_CODES.NOT_FOUND, MESSAGES.seoNotAvailable);
  }

  // Re-parse (cheap) so `data` is guaranteed the stripped, stored shape even
  // though the router's validate() already ran the same schema.
  const parsed = seoSchema.parse(data);

  const assetMap = await loadAssetMap([parsed]);

  // collectAssetIssues reports the mediaRef's own container path ("ogImage")
  // — rewritten to "ogImage.assetId" here so this endpoint's error paths
  // stay byte-identical to before the shared-helper extraction.
  const assetIssues = collectAssetIssues(parsed, assetMap, "").map((issue) =>
    issue.path === "ogImage" ? { ...issue, path: "ogImage.assetId" } : issue
  );

  if (assetIssues.length) {
    throw new ValidationFailed(STATUS_CODES.VALIDATION_FAILED, MESSAGES.validationFailed, assetIssues);
  }

  await Page.updateOne(
    { slug },
    { $setOnInsert: { slug } },
    { upsert: true, setDefaultsOnInsert: true }
  );

  await Page.updateOne(
    { slug },
    { $set: { seo: parsed, updatedBy: new Types.ObjectId(actorId) } }
  );

  return resolveMedia(parsed, assetMap) as ResolvedSeo;
};

/**
 * Used only by the seed script (src/seed/home.ts) so it can reuse the exact
 * same write path/rev semantics the PUT endpoint uses, instead of writing
 * to Mongo directly.
 */
export const getSectionRev = async (slug: string, key: string): Promise<number> => {
  const doc = await Page.findOne(
    { slug },
    { [`sections.${key}.rev`]: 1 }
  )
    .lean<LeanPage | null>()
    .exec();

  const stored = readSection(doc?.sections, key);
  return stored ? stored.rev : 0;
};

/** Raw stored seo for a slug, or null if the page doc doesn't exist yet —
 *  used by the seed script to decide whether seo has "already been saved"
 *  (i.e. differs from emptySeo()). */
export const getStoredSeo = async (slug: string): Promise<ISeo | null> => {
  const doc = await Page.findOne({ slug }, { seo: 1 }).lean<LeanPage | null>().exec();
  return doc?.seo ?? null;
};
