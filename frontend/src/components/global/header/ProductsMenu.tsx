"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import type { PublicCategory } from "@/types/products";

type NavItem = { label: string; href: string; showChevron: boolean };

type ProductsMenuProps = {
  item: NavItem;
  /** Guaranteed non-empty by the caller (`HeaderBar`). */
  categories: PublicCategory[];
};

const CLOSE_DELAY_MS = 150;

/**
 * Replaces the plain nav `<a>` for the item whose `href` is `/products`
 * with a Category -> Product mega-menu, matching the chevron-link styling
 * in `HeaderBar`. Degrades to the plain link one level up (in `HeaderBar`)
 * whenever `categories` is null/empty. See frontend/CLAUDE.md
 * "Products module" and the responsive-layout skill (no `fixed`
 * positioning — the header is `sticky`, which is enough of a containing
 * block for this `absolute` panel).
 */
export default function ProductsMenu({ item, categories }: ProductsMenuProps) {
  const [open, setOpen] = useState(false);
  const [activeSlug, setActiveSlug] = useState(categories[0].slug);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstCategoryRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Set only by a real mouse hover (never touch, never keyboard focus) so a
  // click that follows a hover-open can be told apart from a deliberate
  // click/tap on an already-closed trigger. See onTriggerClick below.
  const openedByPointerRef = useRef(false);
  const focusFirstOnOpenRef = useRef(false);
  const pathname = usePathname();

  // Close on route change (e.g. a Link inside the panel was followed). Done
  // during render (the React-recommended "adjusting state on prop change"
  // pattern) rather than in an effect, so it can't flash the panel open on
  // the destination page before an effect runs.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    if (open) setOpen(false);
  }

  const activeCategory = useMemo(
    () => categories.find((category) => category.slug === activeSlug) ?? categories[0],
    [categories, activeSlug]
  );

  // A hover-open that never got a deliberate click doesn't count as
  // "opened by pointer" any more once the menu actually closes, or a stale
  // flag could mis-read a later keyboard-driven click. Route every close
  // through here (except the toggle in onTriggerClick, which clears the flag
  // itself).
  function closeMenu() {
    setOpen(false);
    openedByPointerRef.current = false;
  }

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Close on outside click/tap.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Move focus to the first category once the panel opens via ArrowDown
  // (waits for the render where `inert` is lifted, so the element is
  // actually focusable).
  useEffect(() => {
    if (open && focusFirstOnOpenRef.current) {
      focusFirstOnOpenRef.current = false;
      firstCategoryRef.current?.focus();
    }
  }, [open]);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  function openNow() {
    clearTimeout(closeTimer.current);
    setOpen(true);
  }

  function closeSoon(event: React.PointerEvent) {
    if (event.pointerType === "touch") return;
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(closeMenu, CLOSE_DELAY_MS);
  }

  function onPointerEnter(event: React.PointerEvent) {
    if (event.pointerType === "touch") return;
    openedByPointerRef.current = true;
    openNow();
  }

  // A press is focus (native) + pointerenter (mouse) + click, in that order.
  // Opening on focus made every click a toggle-closed; opening on hover
  // instead means the click that follows a hover-open should keep the menu
  // open rather than re-close it. `openedByPointerRef` distinguishes "this
  // click is the one that already opened the menu via hover" from "this is
  // a deliberate click/tap on a closed or keyboard-focused trigger".
  function onTriggerClick() {
    if (openedByPointerRef.current) {
      openedByPointerRef.current = false;
      return;
    }
    setOpen((value) => !value);
  }

  function onTriggerKeyDown(event: React.KeyboardEvent) {
    if (event.key !== "ArrowDown") return;
    event.preventDefault();
    if (open) {
      firstCategoryRef.current?.focus();
    } else {
      focusFirstOnOpenRef.current = true;
      openNow();
    }
  }

  function onBlur(event: React.FocusEvent<HTMLDivElement>) {
    const next = event.relatedTarget as Node | null;
    if (!next || !wrapperRef.current?.contains(next)) {
      closeMenu();
    }
  }

  return (
    // `contents` keeps this out of the flex/positioning tree so the
    // absolutely positioned panel below is still anchored to the sticky
    // `<header>`, not to this wrapper.
    <div ref={wrapperRef} className="contents" onBlur={onBlur}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="products-menu"
        className="inline-flex items-center gap-1 text-sm font-medium text-[#404040] transition-colors hover:text-brand"
        onClick={onTriggerClick}
        onPointerEnter={onPointerEnter}
        onPointerLeave={closeSoon}
        onKeyDown={onTriggerKeyDown}
      >
        {item.label}
        {item.showChevron && (
          // eslint-disable-next-line @next/next/no-img-element -- static decorative SVG, never optimized per contract
          <img
            src="/global/header/chevron-down.svg"
            alt=""
            aria-hidden="true"
            className={`h-3.5 w-3.5 motion-safe:transition-transform motion-safe:duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        )}
      </button>

      <div
        id="products-menu"
        aria-label={`${item.label} menu`}
        inert={!open ? true : undefined}
        onPointerEnter={onPointerEnter}
        onPointerLeave={closeSoon}
        className={`absolute inset-x-0 top-full z-40 motion-safe:transition-[opacity,transform] motion-safe:duration-200 ${
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0 motion-safe:-translate-y-1"
        }`}
      >
        <Container>
          <div className="mt-2 grid w-full max-w-[43.75rem] grid-cols-[14rem_1fr] gap-8 rounded-lg border border-ink/10 bg-white p-6 shadow-lg lg:mt-3">
            <div className="flex max-h-[26rem] flex-col gap-1 overflow-y-auto border-r border-ink/10 pr-6">
              {categories.map((category, index) => (
                <button
                  key={category._id}
                  ref={index === 0 ? firstCategoryRef : undefined}
                  type="button"
                  aria-current={category.slug === activeSlug ? "true" : undefined}
                  onMouseEnter={() => setActiveSlug(category.slug)}
                  onFocus={() => setActiveSlug(category.slug)}
                  onClick={() => setActiveSlug(category.slug)}
                  className={`flex flex-col items-start gap-0.5 rounded-lg px-3 py-2.5 text-left transition-colors ${
                    category.slug === activeSlug
                      ? "bg-brand/5 text-brand"
                      : "text-ink hover:bg-grey-100"
                  }`}
                >
                  <span className="text-sm font-medium">{category.name}</span>
                  <span className="text-xs text-ink/60">
                    {category.products.length} product
                    {category.products.length === 1 ? "" : "s"}
                  </span>
                </button>
              ))}
            </div>

            <div className="grid max-h-[26rem] grid-cols-2 gap-x-6 gap-y-1 overflow-y-auto">
              {activeCategory.products.map((product) => (
                <Link
                  key={product._id}
                  href={`/products/${activeCategory.slug}/${product.slug}`}
                  onClick={closeMenu}
                  className="flex flex-col gap-0.5 rounded-lg px-3 py-2.5 transition-colors hover:bg-grey-100 hover:text-brand"
                >
                  <span className="text-sm font-medium text-ink">{product.name}</span>
                  <span className="text-xs text-ink/60">{product.subtitle}</span>
                </Link>
              ))}
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
}
