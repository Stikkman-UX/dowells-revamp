import type { ReactNode } from "react";

type SectionHeadingProps = {
  heading: ReactNode;
  /** Right-aligned slot: a paragraph, a link, a tab list, etc. */
  slot?: ReactNode;
  className?: string;
  headingClassName?: string;
};

/**
 * The 42px Semi Bold section heading pattern shared by every home section.
 * Figma sets these headings in a narrow measure so they break onto two
 * balanced lines ("What can we help you / with today?"),
 * with an optional right-aligned slot. Stacks on mobile, sits side-by-side
 * from `lg` up.
 */
export function SectionHeading({
  heading,
  slot,
  className = "",
  headingClassName = "",
}: SectionHeadingProps) {
  return (
    <div
      className={`flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between ${className}`.trim()}
    >
      <h2
        className={`text-balance text-[2rem] font-semibold leading-tight tracking-tight text-ink lg:max-w-[32rem] lg:text-[2.625rem] ${headingClassName}`.trim()}
      >
        {heading}
      </h2>
      {slot ? <div className="text-grey-600 lg:max-w-md">{slot}</div> : null}
    </div>
  );
}
