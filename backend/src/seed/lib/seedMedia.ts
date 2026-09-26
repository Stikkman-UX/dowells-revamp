import fs from "fs";
import path from "path";

import { EAssetFileType } from "@models/asset/interface";
import * as assetService from "@controllers/asset/assetService";
import {
  AssetFileInput,
  SVG_MAX_SIZE_BYTES,
  decodeStrictUtf8,
  detectBinaryFileType,
  validateSvgContent,
} from "@utils/helper/fileSignature";

/**
 * Shared media-resolution helpers for the content seed scripts (seed:home,
 * seed:products). Extracted from src/seed/home.ts so both scripts upload
 * media through the exact same validation path (magic bytes / SVG content
 * checks — the same helpers src/utils/middleware/upload.ts uses for the
 * HTTP upload route) and de-duplicate uploads the same way.
 *
 * A "seed media ref" is any object of the form:
 *
 *   { "assetId": "", "alt": "...", "url": "<local-path-or-http(s)-url>" }
 *
 * - assetId: "" (empty) + a "url" means "upload the file and use the
 *   resulting assetId". The url may be:
 *     (a) a root-relative local path, resolved as <assetsDir><url> (existing
 *         seed:home behaviour), or
 *     (b) an absolute http(s):// URL, fetched with the global fetch and
 *         type-detected the same way as a local file (no SVG fallback —
 *         an unrecognised binary type is rejected).
 *   Identical urls are only uploaded once per run — the assetId is reused
 *   for every other reference to the same url in the same run.
 * - assetId: "<existing-id>" means "reference this asset as-is" (url/
 *   mimeType/fileType, if present, are stripped, like the admin UI's
 *   round-tripped resolved media).
 * - A missing/unreadable/invalid file (local or remote) is a WARNING, not a
 *   fatal error: that media value becomes null and seeding continues.
 */

export type SeedMediaSummary = {
  assetsUploaded: number;
  assetsReused: number;
  assetsMissing: number;
};

export type SeedMediaContext = {
  assetsDir: string;
  /** Prefix for console output, e.g. "[seed:home]" / "[seed:products]". */
  logPrefix: string;
  /** url -> assetId (or null when the file was missing/invalid), so an
   *  identical url referenced twice in the same run is only uploaded once. */
  uploadCache: Map<string, string | null>;
  summary: SeedMediaSummary;
};

export const createSeedMediaContext = (assetsDir: string, logPrefix: string): SeedMediaContext => ({
  assetsDir,
  logPrefix,
  uploadCache: new Map<string, string | null>(),
  summary: { assetsUploaded: 0, assetsReused: 0, assetsMissing: 0 },
});

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const isRemoteUrl = (url: string): boolean => /^https?:\/\//i.test(url);

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "video/webm": "webm",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "application/pdf": "pdf",
};

const slugForFileName = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

/** Best-effort human-readable original filename for a remote asset — used
 *  only for the Asset's stored metadata/Content-Disposition, never for
 *  storage identity (the assetId is the S3 key, per the asset-management
 *  skill). */
const originalNameForRemote = (url: string, alt: string, mimeType: string): string => {
  const extension = EXTENSION_BY_MIME_TYPE[mimeType] ?? "bin";

  let fromUrl = "";
  try {
    const parsed = new URL(url);
    const lastSegment = parsed.pathname.split("/").filter(Boolean).pop() ?? "";
    fromUrl = slugForFileName(lastSegment.replace(/\.[a-z0-9]+$/i, ""));
  } catch {
    fromUrl = "";
  }

  const stem = slugForFileName(alt) || fromUrl || "seed-asset";
  return `${stem}.${extension}`;
};

/** Reads + type-detects a local file the same way the HTTP upload route
 *  does (magic bytes first, SVG content validation as a fallback). Returns
 *  null (with a console.warn) for a missing file or an unsupported/invalid
 *  one. */
const buildFileInputFromLocalPath = (
  ctx: SeedMediaContext,
  filePath: string
): AssetFileInput | null => {
  if (!fs.existsSync(filePath)) {
    console.warn(`${ctx.logPrefix} missing asset file, setting media to null: ${filePath}`);
    return null;
  }

  const buffer = fs.readFileSync(filePath);

  const binary = detectBinaryFileType(buffer);
  if (binary) {
    return {
      buffer,
      originalName: path.basename(filePath),
      mimeType: binary.mimeType,
      fileType: binary.fileType,
      fileSize: buffer.length,
    };
  }

  const text = decodeStrictUtf8(buffer);
  const looksLikeSvg = text && /<svg[\s>]/i.test(text);

  if (!looksLikeSvg || buffer.length > SVG_MAX_SIZE_BYTES) {
    console.warn(`${ctx.logPrefix} unsupported file type, setting media to null: ${filePath}`);
    return null;
  }

  const svgResult = validateSvgContent(text as string);
  if (!svgResult.valid) {
    console.warn(
      `${ctx.logPrefix} invalid SVG (${svgResult.reason}), setting media to null: ${filePath}`
    );
    return null;
  }

  return {
    buffer,
    originalName: path.basename(filePath),
    mimeType: "image/svg+xml",
    fileType: EAssetFileType.Image,
    fileSize: buffer.length,
  };
};

/** Fetches + type-detects a remote http(s) asset. No SVG fallback (per the
 *  Phase 6a brief): an unrecognised binary type — or a network failure — is
 *  a warning, not a fatal error. */
const buildFileInputFromRemoteUrl = async (
  ctx: SeedMediaContext,
  url: string,
  alt: string
): Promise<AssetFileInput | null> => {
  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    console.warn(`${ctx.logPrefix} failed to fetch remote asset (network error), setting media to null: ${url}`);
    console.warn(error);
    return null;
  }

  if (!response.ok) {
    console.warn(
      `${ctx.logPrefix} failed to fetch remote asset (HTTP ${response.status}), setting media to null: ${url}`
    );
    return null;
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  const binary = detectBinaryFileType(buffer);
  if (!binary) {
    console.warn(
      `${ctx.logPrefix} remote asset has an unrecognised file type, setting media to null: ${url}`
    );
    return null;
  }

  return {
    buffer,
    originalName: originalNameForRemote(url, alt, binary.mimeType),
    mimeType: binary.mimeType,
    fileType: binary.fileType,
    fileSize: buffer.length,
  };
};

const uploadOnce = async (ctx: SeedMediaContext, url: string, alt: string): Promise<string | null> => {
  if (ctx.uploadCache.has(url)) {
    const cached = ctx.uploadCache.get(url) ?? null;
    if (cached) ctx.summary.assetsReused++;
    return cached;
  }

  const fileInput = isRemoteUrl(url)
    ? await buildFileInputFromRemoteUrl(ctx, url, alt)
    : buildFileInputFromLocalPath(ctx, path.join(ctx.assetsDir, url));

  if (!fileInput) {
    ctx.summary.assetsMissing++;
    ctx.uploadCache.set(url, null);
    return null;
  }

  const asset = await assetService.upload(fileInput);
  ctx.uploadCache.set(url, asset.assetId);
  ctx.summary.assetsUploaded++;
  return asset.assetId;
};

/**
 * Deep-walks any value from a seed content file, uploading + rewriting
 * every media-like object ({assetId, alt, url, ...}) to its stored form
 * ({assetId, alt}). Non-media objects/arrays are walked recursively;
 * everything else is returned unchanged.
 */
export const resolveSeedMedia = async (ctx: SeedMediaContext, value: unknown): Promise<unknown> => {
  if (Array.isArray(value)) {
    const out: unknown[] = [];
    for (const item of value) out.push(await resolveSeedMedia(ctx, item));
    return out;
  }

  if (!isPlainObject(value)) return value;

  if (typeof value.assetId === "string") {
    const alt = typeof value.alt === "string" ? value.alt : "";

    if (value.assetId) {
      return { assetId: value.assetId, alt }; // already-existing asset — keep as-is
    }

    const url = typeof value.url === "string" ? value.url : "";
    const isLocal = url.startsWith("/");

    if (!isLocal && !isRemoteUrl(url)) {
      console.warn(
        `${ctx.logPrefix} media has an empty assetId and no root-relative or http(s) "url" — setting to null.`
      );
      return null;
    }

    const assetId = await uploadOnce(ctx, url, alt);
    return assetId ? { assetId, alt } : null;
  }

  const result: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    result[key] = await resolveSeedMedia(ctx, child);
  }
  return result;
};
