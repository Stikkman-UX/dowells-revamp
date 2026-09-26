import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import dotenv from "dotenv";
import { OperationalError } from "@utils/error/errorInstances";

dotenv.config({ override: true });

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const REGION = process.env.AWS_REGION!;
export const BUCKET = process.env.AWS_BUCKET_NAME!;
export const ASSETS_PREFIX = "assets";

export const buildObjectKey = (assetId: string) => `${ASSETS_PREFIX}/${assetId}`;

export function publicUrlForKey(key: string) {
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${encodedKey}`;
}

export type S3UploadOptions = {
  contentType: string;
  /** e.g. `attachment; filename="<assetId>.svg"` for SVG, "inline" otherwise. */
  contentDisposition: string;
  cacheControl?: string;
};

export type S3UploadResult = {
  bucket: string;
  objectKey: string;
  url: string;
};

/**
 * Streams a buffer to S3 under `assets/<assetId>` (or overwrites it in
 * place, for replace()). This is the ONLY function that talks to S3 for
 * asset content — everything else goes through assetService.
 */
export const s3UploadRaw = async (
  abortSignal: AbortSignal,
  assetId: string,
  toS3: Buffer,
  options: S3UploadOptions
): Promise<S3UploadResult> => {
  const objectKey = buildObjectKey(assetId);

  try {
    const upload = new Upload({
      client: s3,
      params: {
        Bucket: BUCKET,
        Key: objectKey,
        Body: toS3,
        ContentType: options.contentType || "application/octet-stream",
        ContentDisposition: options.contentDisposition,
        CacheControl:
          options.cacheControl ?? "public, max-age=31536000, immutable",
      },
      partSize: 5 * 1024 * 1024, // 5MB parts
      queueSize: 4,
      leavePartsOnError: false,
    });

    const onAbort = () => {
      // Was calling upload.done() here, which just continued the upload —
      // upload.abort() is what actually cancels an in-flight multipart upload.
      upload.abort().catch(() => {});
    };
    abortSignal.addEventListener("abort", onAbort);

    try {
      await upload.done();
    } finally {
      abortSignal.removeEventListener("abort", onAbort);
    }

    return { bucket: BUCKET, objectKey, url: publicUrlForKey(objectKey) };
  } catch (error) {
    console.log("Error in raw upload", error);
    throw new OperationalError(500, "Error uploading file to storage");
  }
};
