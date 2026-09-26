export type MediaAccept = "image" | "video" | "image+video" | "svg" | "document";

const IMAGE_MIME = "image/jpeg,image/png,image/webp,image/gif,image/svg+xml";
const VIDEO_MIME = "video/mp4,video/webm,video/quicktime";
const DOCUMENT_MIME = "application/pdf";

/** `accept` attribute for the field's hidden `<input type="file">`. */
export function acceptToInputAttr(accept: MediaAccept): string {
  switch (accept) {
    case "image":
      return IMAGE_MIME;
    case "video":
      return VIDEO_MIME;
    case "image+video":
      return `${IMAGE_MIME},${VIDEO_MIME}`;
    case "svg":
      return "image/svg+xml";
    case "document":
      return DOCUMENT_MIME;
  }
}

/** Mirrors the backend limits (API_CONTRACT §3) for a pre-upload hint only — the server is the authority. */
export function maxSizeBytes(mimeType?: string): number {
  return mimeType === "image/svg+xml" ? 200 * 1024 : 50 * 1024 * 1024;
}
