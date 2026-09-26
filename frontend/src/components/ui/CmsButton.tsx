import Link from "next/link";
import type { Button as CmsButtonData, CtaButton } from "@/types/cms";
import { CmsIcon } from "./CmsIcon";

export type CmsButtonVariant =
  | "primary"
  | "secondary"
  | "dark"
  | "link"
  | "accentLink";
export type CmsButtonSize = "sm" | "md";

type CmsButtonProps = {
  button: CmsButtonData;
  variant?: CmsButtonVariant;
  size?: CmsButtonSize;
  className?: string;
  /** Presentational adornment rendered after the label (e.g. the hero CTA's arrow). Not CMS data. */
  trailing?: React.ReactNode;
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

const VARIANT_CLASSES: Record<CmsButtonVariant, string> = {
  primary: "bg-brand text-white hover:bg-brand-dark",
  secondary: "border border-ink/15 bg-white text-ink hover:border-ink/30",
  dark: "bg-ink text-white hover:bg-grey-900",
  link: "rounded-none bg-transparent p-0! text-ink underline-offset-4 hover:underline",
  accentLink:
    "rounded-none bg-transparent p-0! text-brand underline-offset-4 hover:text-brand-dark hover:underline",
};

const SIZE_CLASSES: Record<CmsButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-sm md:text-base",
};

/** Maps an admin-chosen `CtaButton.variant` onto the presentational variant. */
export function ctaVariant(variant: CtaButton["variant"]): CmsButtonVariant {
  return variant === "white" ? "secondary" : "primary";
}

function isAbsoluteOrSpecialHref(href: string) {
  return /^([a-z][a-z0-9+.-]*:)/i.test(href) || href.startsWith("//");
}

/**
 * THE single button/link renderer for the site. Driven by the contract's
 * `Button` shape (text/href/icon/iconPosition/openInNewTab); `variant` and
 * `size` are purely presentational and chosen by the layout slot that
 * renders the button. The only CMS-stored colour choice is `CtaButton.variant`
 * (red/white), which slots translate via `ctaVariant()`.
 */
export function CmsButton({
  button,
  variant = "primary",
  size = "md",
  className = "",
  trailing,
}: CmsButtonProps) {
  const { text, href, withIcon, icon, iconPosition, openInNewTab } = button;

  if (!text) return null;

  const isLink = variant === "link" || variant === "accentLink";
  const classes = `${BASE} ${VARIANT_CLASSES[variant]} ${
    isLink ? "" : SIZE_CLASSES[size]
  } ${className}`
    .replace(/\s+/g, " ")
    .trim();

  const iconEl = withIcon ? <CmsIcon media={icon} size={16} /> : null;

  const content = (
    <>
      {iconPosition === "left" && iconEl}
      <span>{text}</span>
      {iconPosition === "right" && iconEl}
      {trailing}
    </>
  );

  if (!href) {
    return <span className={classes}>{content}</span>;
  }

  if (openInNewTab || isAbsoluteOrSpecialHref(href)) {
    return (
      <a
        href={href}
        className={classes}
        {...(openInNewTab
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {content}
    </Link>
  );
}
