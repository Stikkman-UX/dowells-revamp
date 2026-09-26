const KB = 1024;
const MB = KB * 1024;
const GB = MB * 1024;

/**
 * Formats a byte count the way the Downloads section and MediaField's
 * Document preview show it: "640 KB", "1.4 MB", "18.2 MB". Below 1 MB uses
 * whole KB, at or above 1 MB uses one decimal of MB, at or above 1 GB uses
 * one decimal of GB.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < MB) {
    return `${Math.round(bytes / KB)} KB`;
  }
  if (bytes < GB) {
    return `${(bytes / MB).toFixed(1)} MB`;
  }
  return `${(bytes / GB).toFixed(1)} GB`;
}

/**
 * Short, human label for a mime type, e.g. for "1.4 MB · PDF" captions.
 * `application/pdf` -> "PDF"; everything else -> the uppercased subtype
 * (`image/svg+xml` -> "SVG", `video/mp4` -> "MP4").
 */
export function fileTypeLabel(mimeType: string): string {
  if (mimeType === "application/pdf") return "PDF";
  const subtype = mimeType.split("/")[1] ?? mimeType;
  return subtype.split("+")[0].toUpperCase();
}
