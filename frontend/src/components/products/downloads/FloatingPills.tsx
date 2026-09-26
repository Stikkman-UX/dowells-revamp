/**
 * Figma 313:1527 shows two pills: "Downloads" (functional, scrolls to this
 * section) and a decorative "Ask AI" pill with no behaviour behind it yet.
 * A pill that looks clickable but does nothing would mislead users, so it's
 * omitted here rather than rendered inert — see the phase report for this
 * judgment call. Rendered inline in the Downloads header row (D-5A-2) rather
 * than sticky-floating — the header row already keeps it in view for as long
 * as the heading is, so a separate sticky layer only fought the row's layout
 * for no visual benefit. Hidden below `lg` per the design.
 */
export default function FloatingPills() {
  return (
    <a
      href="#downloads"
      className="hidden shrink-0 items-center gap-2 rounded-pill border-2 border-white bg-black/30 px-5 py-3 text-sm font-medium text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-black/45 lg:inline-flex"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- static Figma SVG, not CMS content. */}
      <img src="/products/download.svg" alt="" className="h-[1.125rem] w-[1.125rem]" />
      Downloads
    </a>
  );
}
