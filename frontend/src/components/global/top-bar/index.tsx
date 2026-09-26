import { Container } from "@/components/ui/Container";

const DEALER_HREF = "#";
const PHONE_NUMBER = "1800-267-0008";
const PHONE_HREF = "tel:18002670008";
const INVESTORS_HREF = "#";
const CAREERS_HREF = "#";

/**
 * Static, non-CMS utility bar above the header. Content here is fixed in
 * code (not editable content per CLAUDE.md's CMS philosophy — this is
 * navigation/layout chrome, not page content). Matches Figma node 313:878.
 */
export default function TopBar() {
  return (
    <div className="w-full bg-grey-100 text-ink/80">
      <Container className="flex h-9 items-center justify-between gap-4 text-xs tracking-[0.025em]">
        <div className="flex min-w-0 items-center gap-5">
          <a
            href={DEALER_HREF}
            className="inline-flex items-center gap-1.5 transition-colors hover:text-ink"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- static decorative SVG, never optimized per contract */}
            <img
              src="/global/top-bar/location-pin.svg"
              alt=""
              aria-hidden="true"
              className="h-3 w-3 shrink-0"
            />
            <span className="hidden sm:inline">Find a dealer near you</span>
          </a>
          <a
            href={PHONE_HREF}
            className="inline-flex shrink-0 items-center gap-1.5 transition-colors hover:text-ink"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- static decorative SVG, never optimized per contract */}
            <img
              src="/global/top-bar/phone.svg"
              alt=""
              aria-hidden="true"
              className="h-3 w-3 shrink-0"
            />
            <span>{PHONE_NUMBER}</span>
          </a>
        </div>
        <div className="hidden shrink-0 items-center gap-5 lg:flex">
          <a href={INVESTORS_HREF} className="transition-colors hover:text-ink">
            Investors
          </a>
          <a href={CAREERS_HREF} className="transition-colors hover:text-ink">
            Careers
          </a>
          <span>EN / हिन्दी</span>
        </div>
      </Container>
    </div>
  );
}
