import * as assetService from "@controllers/asset/assetService";
import { AssetResponse } from "@controllers/asset/assetService";
import { EAssetFileType } from "@models/asset/interface";
import { MESSAGES } from "@src/constants";
import { ValidationIssue } from "@utils/error/errorInstances";

/**
 * Pure, dependency-free helpers for walking already-zod-parsed section (or
 * seo) data to find/resolve media references. No Express, no DB — safe to
 * unit test directly. Used by controllers/page/services.ts for the
 * asset-aware validation and read-time resolution steps described in the
 * task brief ("Asset-aware validation").
 */

export type MediaRefLocation = {
  /** Dotted path to the assetId's containing object, relative to the value
   *  passed in (no leading dot, e.g. "buttons.1.icon"). */
  path: string;
  assetId: string;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

/**
 * Walks any JSON-like value and returns `{ path, assetId }` for every object
 * that has a string `assetId` key (i.e. every stored MediaRef). Does not
 * recurse into a MediaRef's own keys (it has none worth walking).
 */
export const collectMediaRefs = (data: unknown, basePath = ""): MediaRefLocation[] => {
  const results: MediaRefLocation[] = [];

  const walk = (value: unknown, path: string) => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, path ? `${path}.${index}` : `${index}`));
      return;
    }

    if (!isPlainObject(value)) return;

    if (typeof value.assetId === "string") {
      results.push({ path, assetId: value.assetId });
      return;
    }

    for (const [key, child] of Object.entries(value)) {
      walk(child, path ? `${path}.${key}` : key);
    }
  };

  walk(data, basePath);
  return results;
};

export type MediaPosterPair = {
  /** Path to the object that directly owns both `media` and `poster`. */
  path: string;
  mediaAssetId: string | null;
  posterAssetId: string | null;
};

/**
 * Walks any JSON-like value and returns every object that owns BOTH a
 * `media` and a `poster` key directly (e.g. a hero carousel item) — the shape the
 * "video needs a poster" rule (API_CONTRACT §4.1) applies to.
 */
export const collectMediaPosterPairs = (data: unknown, basePath = ""): MediaPosterPair[] => {
  const results: MediaPosterPair[] = [];

  const assetIdOf = (value: unknown): string | null =>
    isPlainObject(value) && typeof value.assetId === "string" ? value.assetId : null;

  const walk = (value: unknown, path: string) => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, path ? `${path}.${index}` : `${index}`));
      return;
    }

    if (!isPlainObject(value)) return;

    if ("media" in value && "poster" in value) {
      results.push({
        path,
        mediaAssetId: assetIdOf(value.media),
        posterAssetId: assetIdOf(value.poster),
      });
    }

    for (const [key, child] of Object.entries(value)) {
      walk(child, path ? `${path}.${key}` : key);
    }
  };

  walk(data, basePath);
  return results;
};

/**
 * Deep-copies `data`, replacing every stored MediaRef (`{assetId, alt}`)
 * with its resolved form (`{assetId, alt, url, mimeType, fileType}`), or
 * `null` when the asset no longer exists (API_CONTRACT §4.1).
 */
export const resolveMedia = (data: unknown, assetMap: Map<string, AssetResponse>): unknown => {
  const walk = (value: unknown): unknown => {
    if (Array.isArray(value)) {
      return value.map(walk);
    }

    if (!isPlainObject(value)) return value;

    if (typeof value.assetId === "string") {
      const asset = assetMap.get(value.assetId);
      if (!asset) return null;

      return {
        assetId: asset.assetId,
        alt: typeof value.alt === "string" ? value.alt : "",
        url: asset.url,
        mimeType: asset.mimeType,
        fileType: asset.fileType,
        fileSize: asset.fileSize,
      };
    }

    const result: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      result[key] = walk(child);
    }
    return result;
  };

  return walk(data);
};

/** Every mediaRef whose own key is literally "icon" must resolve to an SVG. */
export const isIconPath = (path: string): boolean => path.split(".").pop() === "icon";

/** A mediaRef whose own key is literally "file" must resolve to a Document
 *  (API_CONTRACT §4.1); every other media field must NOT be a Document. */
export const isFilePath = (path: string): boolean => path.split(".").pop() === "file";

/** The seo/product "ogImage" field must resolve to a raster image. */
export const isOgImagePath = (path: string): boolean => path.split(".").pop() === "ogImage";

export const isSvgAsset = (asset: AssetResponse): boolean => asset.mimeType === "image/svg+xml";

export const isImageAsset = (asset: AssetResponse): boolean =>
  asset.fileType === EAssetFileType.Image;

export const isVideoAsset = (asset: AssetResponse): boolean =>
  asset.fileType === EAssetFileType.Video;

export const isDocumentAsset = (asset: AssetResponse): boolean =>
  asset.fileType === EAssetFileType.Document;

/** An Image asset that is not an SVG — what `ogImage` must resolve to. */
export const isRasterImageAsset = (asset: AssetResponse): boolean =>
  isImageAsset(asset) && !isSvgAsset(asset);

// ---- shared asset-aware validation (page sections + products) ------------

/**
 * Collects every unique assetId referenced across `values` (via
 * `collectMediaRefs`) and resolves them in a single `assetService.getMany`
 * call. Returns an empty Map when there are no ids — no DB round trip.
 */
export const loadAssetMap = async (values: unknown[]): Promise<Map<string, AssetResponse>> => {
  const ids = new Set<string>();
  for (const value of values) {
    for (const ref of collectMediaRefs(value)) ids.add(ref.assetId);
  }

  if (!ids.size) return new Map<string, AssetResponse>();

  return assetService.getMany(Array.from(ids));
};

/**
 * Runs the full asset-aware validation rules (API_CONTRACT §4.1 / §6.3)
 * against already zod-parsed data: every assetId must exist, `icon` must be
 * SVG, `file` must be a Document (and no other media field may be one),
 * `ogImage` must be a raster image, and a video `media` needs an image
 * `poster`. Returns every issue found (does not throw) — the caller wraps
 * them in a `ValidationFailed` alongside its own path-prefix convention.
 * Paths are `pathPrefix + location.path`.
 */
export const collectAssetIssues = (
  data: unknown,
  assetMap: Map<string, AssetResponse>,
  pathPrefix = ""
): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];

  for (const ref of collectMediaRefs(data)) {
    const path = `${pathPrefix}${ref.path}`;
    const asset = assetMap.get(ref.assetId);

    if (!asset) {
      issues.push({ path, message: MESSAGES.assetNotFound });
      continue;
    }

    if (isIconPath(ref.path) && !isSvgAsset(asset)) {
      issues.push({ path, message: MESSAGES.iconMustBeSvg });
      continue;
    }

    if (isFilePath(ref.path)) {
      if (!isDocumentAsset(asset)) {
        issues.push({ path, message: MESSAGES.fileMustBeDocument });
      }
      continue;
    }

    if (isOgImagePath(ref.path)) {
      if (!isRasterImageAsset(asset)) {
        issues.push({ path, message: MESSAGES.ogImageMustBeImage });
      }
      continue;
    }

    if (isDocumentAsset(asset)) {
      issues.push({ path, message: MESSAGES.documentNotAllowed });
    }
  }

  for (const pair of collectMediaPosterPairs(data)) {
    if (!pair.mediaAssetId) continue;

    const mediaAsset = assetMap.get(pair.mediaAssetId);
    if (!mediaAsset || !isVideoAsset(mediaAsset)) continue;

    const posterAsset = pair.posterAssetId ? assetMap.get(pair.posterAssetId) : undefined;
    if (!posterAsset || !isImageAsset(posterAsset)) {
      const posterPath = pair.path ? `${pair.path}.poster` : "poster";
      issues.push({ path: `${pathPrefix}${posterPath}`, message: MESSAGES.posterRequired });
    }
  }

  return issues;
};
