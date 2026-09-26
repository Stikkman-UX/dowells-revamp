"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import type { ProductCategoriesData, ResolvedMedia } from "@/types/cms";
import { CmsMedia } from "@/components/ui/CmsMedia";
import { CmsButton } from "@/components/ui/CmsButton";
import { CmsIcon } from "@/components/ui/CmsIcon";

type Category = ProductCategoriesData["categories"][number];

type CategoryTabsProps = { categories: Category[] };

const CHEVRON_ACTIVE: ResolvedMedia = {
  assetId: "",
  alt: "",
  url: "/home/product-categories/icon-tab-chevron-active.svg",
  mimeType: "image/svg+xml",
  fileType: "Image",
  fileSize: 0,
};

const CHEVRON: ResolvedMedia = {
  assetId: "",
  alt: "",
  url: "/home/product-categories/icon-tab-chevron.svg",
  mimeType: "image/svg+xml",
  fileType: "Image",
  fileSize: 0,
};

/**
 * Vertical hover-tabs + feature-panel treatment for Product Categories.
 * All panels are server-rendered and stacked; only visibility/opacity is
 * toggled client-side (dissolve, 300ms ease-out), so every category's
 * copy is present in the DOM for SEO regardless of which tab is active.
 * On small screens the tab list becomes a horizontal scroll-snap chip row
 * above the panel instead of a vertical list.
 */
export default function CategoryTabs({ categories }: CategoryTabsProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const baseId = useId();
  const lastIndex = categories.length - 1;

  function activate(index: number, focusTab = false) {
    setActiveIndex(index);
    if (focusTab) tabRefs.current[index]?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    switch (event.key) {
      case "ArrowDown":
      case "ArrowRight":
        event.preventDefault();
        activate(index === lastIndex ? 0 : index + 1, true);
        break;
      case "ArrowUp":
      case "ArrowLeft":
        event.preventDefault();
        activate(index === 0 ? lastIndex : index - 1, true);
        break;
      case "Home":
        event.preventDefault();
        activate(0, true);
        break;
      case "End":
        event.preventDefault();
        activate(lastIndex, true);
        break;
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[709fr_499fr] lg:items-stretch">
      {/* Feature panel — every category's panel is in the DOM; only the
          active one is visible/interactive. */}
      <div className="relative order-2 min-h-[26rem] overflow-hidden rounded-lg lg:order-1 lg:min-h-0">
        {categories.map((category, index) => {
          const active = index === activeIndex;
          return (
            <div
              key={category.name}
              id={`${baseId}-panel-${index}`}
              role="tabpanel"
              aria-labelledby={`${baseId}-tab-${index}`}
              inert={active ? undefined : true}
              className={`absolute inset-0 flex flex-col justify-end overflow-hidden rounded-lg transition-opacity duration-300 ease-out ${
                active ? "z-10 opacity-100" : "invisible z-0 opacity-0"
              }`}
            >
              <CmsMedia
                media={category.image}
                preload={index === 0}
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="-z-10"
              />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              <div className="flex flex-col items-start gap-3 p-6 sm:p-10">
                {category.badge && (
                  <span className="text-[0.6875rem] uppercase tracking-[0.16em] text-white">
                    {category.badge}
                  </span>
                )}
                <h3 className="text-[1.75rem] font-semibold leading-tight text-white sm:text-[2.5rem]">
                  {category.name}
                </h3>
                <p className="max-w-[26rem] text-base text-white/80">{category.description}</p>
                <CmsButton
                  button={category.button}
                  variant="secondary"
                  className="mt-2 border-transparent bg-white text-ink hover:bg-white/90"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Tab list: horizontal scroll-snap chips on mobile, vertical rows from lg up */}
      <div
        role="tablist"
        aria-label="Product categories"
        aria-orientation="vertical"
        className="order-1 flex snap-x gap-2 overflow-x-auto pb-1 lg:order-2 lg:flex-col lg:gap-0 lg:overflow-visible lg:rounded-lg lg:border lg:border-black/5 lg:pb-0"
      >
        {categories.map((category, index) => {
          const active = index === activeIndex;
          return (
            <button
              key={category.name}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              id={`${baseId}-tab-${index}`}
              role="tab"
              type="button"
              aria-selected={active}
              aria-controls={`${baseId}-panel-${index}`}
              tabIndex={active ? 0 : -1}
              onClick={() => activate(index)}
              onFocus={() => activate(index)}
              onPointerEnter={(event) => {
                if (event.pointerType === "mouse") activate(index);
              }}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={`shrink-0 snap-start rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand lg:flex lg:w-full lg:items-center lg:gap-4 lg:rounded-none lg:border-b lg:border-black/5 lg:px-5 lg:py-5 lg:text-left last:lg:border-b-0 ${
                active
                  ? "bg-[#fff5f5] text-brand lg:bg-[#fff5f5]"
                  : "border border-black/10 bg-white text-ink lg:border-0 lg:bg-white"
              }`}
            >
              <span className="lg:hidden">{category.name}</span>

              <span
                aria-hidden="true"
                className={`hidden size-10 shrink-0 items-center justify-center rounded-full text-sm font-medium lg:flex ${
                  active ? "bg-brand text-white" : "bg-grey-100 text-grey-500"
                }`}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="hidden flex-1 flex-col items-start lg:flex">
                <span className="text-base font-semibold text-ink">{category.name}</span>
                <span className="text-xs font-medium text-grey-500">{category.countLabel}</span>
              </span>
              <CmsIcon
                media={active ? CHEVRON_ACTIVE : CHEVRON}
                size={16}
                className={`hidden shrink-0 lg:block ${active ? "text-brand" : "text-grey-400"}`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
