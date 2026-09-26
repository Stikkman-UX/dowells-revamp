import type { CSSProperties } from "react";
import type { ResolvedMedia } from "@/types/cms";

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

  const style: CSSProperties = {
    width: size,
    height: size,
    maskImage: `url(${media.url})`,
    maskSize: "contain",
    maskRepeat: "no-repeat",
    maskPosition: "center",
    WebkitMaskImage: `url(${media.url})`,
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
