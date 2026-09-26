import crypto from "crypto";
import Asset, { IAsset } from "@models/asset/asset";
import { EAssetFileType } from "@models/asset/interface";
import { OperationalError } from "@utils/error/errorInstances";
import { MESSAGES, STATUS_CODES } from "@src/constants";
import { publicUrlForKey, s3UploadRaw } from "@utils/helper/s3Upload";
import { AssetFileInput } from "@utils/helper/fileSignature";

/**
 * The ONLY module allowed to talk to S3 (via s3Upload.ts) or import s3Upload
 * directly — every other module (controllers, future business models) goes
 * through the functions exported here. See .claude/skills/asset-management.md.
 */

export type AssetResponse = {
  assetId: string;
  url: string;
  mimeType: string;
  fileType: EAssetFileType;
  originalName: string;
  fileSize: number;
  createdAt: string;
  updatedAt: string;
};

/** ≤100 chars, `[A-Za-z0-9._-]` only (other runs collapsed to a single `-`,
 *  trimmed), extension stripped — falls back to `assetId` when empty. */
const safeFileNameStem = (originalName: string, assetId: string): string => {
  const withoutExtension = originalName.replace(/\.[^./\\]+$/, "");
  const sanitised = withoutExtension
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[.-]+|[.-]+$/g, "")
    .slice(0, 100);

  return sanitised || assetId;
};

/**
 * The only place that decides an asset's `Content-Disposition`. PDFs always
 * download (`attachment`, sanitised original filename) since the S3 origin
 * is cross-origin and an `<a download>` attribute would be ignored. SVGs
 * keep their existing attachment-with-assetId-name behaviour (never inlined
 * — see asset-management skill). Everything else is served inline.
 */
export const contentDispositionFor = (
  assetId: string,
  mimeType: string,
  originalName: string
): string => {
  if (mimeType === "application/pdf") {
    return `attachment; filename="${safeFileNameStem(originalName, assetId)}.pdf"`;
  }

  if (mimeType === "image/svg+xml") {
    return `attachment; filename="${assetId}.svg"`;
  }

  return "inline";
};

/**
 * The only place an asset URL is built. Always versioned with `?v=<updatedAt
 * ms>` so a replace() (same object key, overwritten in place) busts caches
 * immediately instead of serving a stale file for up to a year (see the
 * immutable Cache-Control set in s3Upload.ts).
 */
export const toResponse = (asset: IAsset): AssetResponse => {
  const updatedAtMs = asset.updatedAt.getTime();

  return {
    assetId: asset.assetId,
    url: `${publicUrlForKey(asset.objectKey)}?v=${updatedAtMs}`,
    mimeType: asset.metadata.mimeType,
    fileType: asset.metadata.fileType,
    originalName: asset.metadata.originalName,
    fileSize: asset.metadata.fileSize,
    createdAt: asset.createdAt.toISOString(),
    updatedAt: asset.updatedAt.toISOString(),
  };
};

export const upload = async (file: AssetFileInput): Promise<AssetResponse> => {
  const assetId = crypto.randomUUID(); // also the S3 object key — never the original filename
  const controller = new AbortController();

  const { bucket, objectKey } = await s3UploadRaw(
    controller.signal,
    assetId,
    file.buffer,
    {
      contentType: file.mimeType,
      contentDisposition: contentDispositionFor(assetId, file.mimeType, file.originalName),
    }
  );

  const asset = await Asset.create({
    assetId,
    bucket,
    objectKey,
    metadata: {
      originalName: file.originalName,
      mimeType: file.mimeType,
      fileType: file.fileType,
      fileSize: file.fileSize,
    },
  });

  return toResponse(asset);
};

/**
 * Overwrites the SAME S3 object (same assetId/objectKey) — no business
 * model ever needs updating. The new file must be the same fileType as the
 * one it replaces (API_CONTRACT §3).
 */
export const replace = async (
  assetId: string,
  file: AssetFileInput
): Promise<AssetResponse> => {
  const existing = await Asset.findOne({ assetId });

  if (!existing) {
    throw new OperationalError(STATUS_CODES.NOT_FOUND, MESSAGES.assetNotFound);
  }

  if (existing.metadata.fileType !== file.fileType) {
    throw new OperationalError(
      STATUS_CODES.UNPROCESSABLE,
      `Replacement file must be the same type as the existing asset (${existing.metadata.fileType})`
    );
  }

  const controller = new AbortController();

  const { bucket, objectKey } = await s3UploadRaw(
    controller.signal,
    assetId,
    file.buffer,
    {
      contentType: file.mimeType,
      contentDisposition: contentDispositionFor(assetId, file.mimeType, file.originalName),
    }
  );

  // Explicit $set of updatedAt guarantees the cache-busting version stamp
  // changes even if Mongoose otherwise decides nothing "changed".
  const asset = await Asset.findOneAndUpdate(
    { assetId },
    {
      $set: {
        bucket,
        objectKey,
        metadata: {
          originalName: file.originalName,
          mimeType: file.mimeType,
          fileType: file.fileType,
          fileSize: file.fileSize,
        },
        updatedAt: new Date(),
      },
    },
    { new: true }
  );

  // Cannot happen (we just confirmed the doc exists above), but keeps TS happy.
  if (!asset) {
    throw new OperationalError(STATUS_CODES.NOT_FOUND, MESSAGES.assetNotFound);
  }

  return toResponse(asset);
};

/**
 * Batch-resolves assetIds in a single query — avoids N+1 lookups. This is
 * the CMS read path: every page GET resolves its stored MediaRefs here.
 */
export const getMany = async (
  assetIds: string[]
): Promise<Map<string, AssetResponse>> => {
  const result = new Map<string, AssetResponse>();
  const uniqueIds = Array.from(new Set(assetIds)).filter(Boolean);

  if (!uniqueIds.length) return result;

  const assets = await Asset.find({ assetId: { $in: uniqueIds } });

  for (const asset of assets) {
    result.set(asset.assetId, toResponse(asset));
  }

  return result;
};
