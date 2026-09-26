import { forwardRef } from "react";
import Image from "next/image";
import type { ResolvedMedia } from "@/types/cms";

type CmsMediaProps = {
  media: ResolvedMedia;
  /** Resolved poster image; required by the contract when `media` is a Video. */
  poster?: ResolvedMedia;
  alt?: string;
  className?: string;
  /** When true (default), media absolutely fills its (positioned) parent. */
  fill?: boolean;
  sizes?: string;
  width?: number;
  height?: number;
  objectFit?: "cover" | "contain";
  /** Forwarded to next/image; use for the LCP image (e.g. hero), not `priority` (deprecated in Next 16). */
  preload?: boolean;
  /** Forwarded to next/image. Use "eager" for media that is in view but must not compete with the LCP image. */
  loading?: "eager" | "lazy";
};

/**
 * The single media renderer for resolved CMS media. Branches on the
 * resolved shape:
 * - `null` -> neutral placeholder block
 * - `image/svg+xml` -> plain `<img>` (SVGs are never optimized/inlined per
 *   the contract's security rules)
 * - other images -> `next/image`
 * - Video -> `<video>` (muted/looping/no-autoplay-preload), ref-forwarded so
 *   callers can drive playback (e.g. from GSAP or on hover).
 */
export const CmsMedia = forwardRef<HTMLVideoElement, CmsMediaProps>(
  function CmsMedia(
    {
      media,
      poster,
      alt,
      className = "",
      fill = true,
      sizes,
      width,
      height,
      objectFit = "cover",
      preload,
      loading,
    },
    ref
  ) {
    const objectClass = objectFit === "cover" ? "object-cover" : "object-contain";
    const fillClass = fill ? "absolute inset-0 h-full w-full" : "";

    if (!media || media.fileType === "Document") {
      // Documents (PDFs) are never rendered inline — they're linked to, not
      // displayed — so this is the same neutral placeholder as `null`.
      return (
        <div
          aria-hidden="true"
          className={`bg-grey-100 ${fillClass} ${className}`.trim()}
        />
      );
    }

    if (media.fileType === "Video") {
      return (
        <video
          ref={ref}
          muted
          playsInline
          loop
          preload="none"
          poster={poster?.url}
          className={`${fillClass} ${objectClass} ${className}`.trim()}
        >
          <source src={media.url} type={media.mimeType} />
        </video>
      );
    }

    const altText = alt ?? media.alt;

    if (media.mimeType === "image/svg+xml") {
      return (
        // eslint-disable-next-line @next/next/no-img-element -- SVGs are never optimized/inlined, per contract.
        <img
          src={media.url}
          alt={altText}
          className={`${fillClass} ${objectClass} ${className}`.trim()}
        />
      );
    }

    if (fill) {
      return (
        <Image
          src={media.url}
          alt={altText}
          fill
          sizes={sizes ?? "100vw"}
          preload={preload}
          loading={preload ? undefined : loading}
          className={`${objectClass} ${className}`.trim()}
        />
      );
    }

    return (
      <Image
        src={media.url}
        alt={altText}
        width={width ?? 800}
        height={height ?? 600}
        preload={preload}
        loading={preload ? undefined : loading}
        className={`${objectClass} ${className}`.trim()}
      />
    );
  }
);
