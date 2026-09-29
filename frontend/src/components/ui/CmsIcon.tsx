import type { CSSProperties } from "react";
import type { ResolvedMedia } from "@/types/cms";

/**
 * `mask-image` is always fetched in CORS mode. S3 only sends
 * `Access-Control-Allow-Origin` when the request carries an `Origin`, and
 * marks assets `immutable` without `Vary: Origin` — so once a plain `<img>`
 * (e.g. the admin media thumbnail) has cached the same URL, the mask reuses
 * that header-less copy, fails the CORS check and the icon renders blank.
 * A mask-only query param gives the CORS fetch its own cache entry; S3
 * ignores unknown params.
 */
function maskSafeUrl(url: string): string {
  if (!/^https?:\/\//i.test(url)) return url; // same-origin asset, no CORS involved
  return `${url}${url.includes("?") ? "&" : "?"}mask=1`;
}

type CmsIconProps = {
  media: ResolvedMedia;
  /** Explicit box size in px (both width and height). */
  size?: number;
  className?: string;
};

/**
 * Renders a resolved SVG icon asset via CSS `mask-image` + `background-color:
 * currentColor`, so a single SVG works on both a red button and a white one
 * — the caller controls color entirely through text color / `className`.
 * Renders nothing when `media` is null (contract: icon fields resolve to
 * null if unset or the referenced asset was deleted).
 */
export function CmsIcon({ media, size = 20, className = "" }: CmsIconProps) {
  if (!media) return null;

  const maskUrl = `url("${maskSafeUrl(media.url)}")`;

  const style: CSSProperties = {
    width: size,
    height: size,
    maskImage: maskUrl,
    maskSize: "contain",
    maskRepeat: "no-repeat",
    maskPosition: "center",
    WebkitMaskImage: maskUrl,
    WebkitMaskSize: "contain",
    WebkitMaskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
  };

  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 bg-current ${className}`.trim()}
      style={style}
    />
  );
}
