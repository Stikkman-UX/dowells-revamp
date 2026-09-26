"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import type { Button as CmsButtonData } from "@/types/cms";
import type { PublicCategory } from "@/types/products";
import { CmsButton } from "@/components/ui/CmsButton";

type NavItem = { label: string; href: string; showChevron: boolean };

type MobileDrawerProps = {
  id: string;
  open: boolean;
  onClose: () => void;
  navItems: NavItem[];
  /** Null/empty keeps the Products item a plain link. */
  productsMenu: PublicCategory[] | null;
  ctaButton: CmsButtonData;
};

/** The "Products" nav item is keyed off its `href`, not its label. */
function isProductsLink(href: string) {
  return href.replace(/\/$/, "") === "/products";
}

/**
 * Accessible off-canvas drawer for the below-`lg` nav. Traps focus, closes
 * on Escape, locks body scroll while open, and restores focus to the
 * trigger on close.
 */
export default function MobileDrawer({
  id,
  open,
  onClose,
  navItems,
  productsMenu,
  ctaButton,
}: MobileDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  // Portal target isn't available during SSR, and rendering into it before
  // hydration would mismatch — mount flag defers the portal to the client.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot client-mount flag to defer the portal past hydration, not derived render state
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const getFocusable = () =>
      panel?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) ?? null;

    getFocusable()?.[0]?.focus();

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = getFocusable();
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = originalOverflow;
      previouslyFocused.current?.focus();
    };
  }, [open, onClose]);

  if (!mounted) return null;

  // Portalled to `document.body`: the header is `sticky` with `backdrop-blur`
  // (a `backdrop-filter`), which makes it a containing block for `fixed`
  // descendants — a `fixed inset-0` wrapper rendered inside it is confined to
  // the header's own box instead of the viewport. Portalling escapes that
  // without touching the header's blur. `id`/`aria-controls` still resolve:
  // portals move DOM placement, not the element's attributes.
  return createPortal(
    // Clipping wrapper: the closed panel is parked off-canvas to the right, and
    // without `overflow-hidden` here it widens the document (horizontal scroll
    // on every mobile page).
    <div
      id={id}
      className={`fixed inset-0 z-50 overflow-hidden lg:hidden ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-ink/40 transition-opacity duration-200 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Primary navigation"
        inert={!open ? true : undefined}
        className={`absolute inset-y-0 right-0 flex w-[85vw] max-w-xs flex-col gap-6 overflow-y-auto bg-white p-6 shadow-xl transition-transform duration-300 ${
          open ? "translate-x-0" : "pointer-events-none translate-x-full"
        }`}
      >
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-grey-100"
          >
            <span aria-hidden="true" className="relative block h-4 w-4">
              <span className="absolute left-0 top-1/2 h-[1.5px] w-full -translate-y-1/2 rotate-45 bg-current" />
              <span className="absolute left-0 top-1/2 h-[1.5px] w-full -translate-y-1/2 -rotate-45 bg-current" />
            </span>
          </button>
        </div>

        <nav aria-label="Primary" className="flex flex-col gap-1">
          {navItems.map((item) => {
            if (isProductsLink(item.href) && productsMenu && productsMenu.length > 0) {
              return (
                <details key={item.label} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-1 rounded-lg px-3 py-3 text-base font-medium text-ink transition-colors hover:bg-grey-100 [&::-webkit-details-marker]:hidden">
                    {item.label}
                    {/* eslint-disable-next-line @next/next/no-img-element -- static decorative SVG, never optimized per contract */}
                    <img
                      src="/global/header/chevron-down.svg"
                      alt=""
                      aria-hidden="true"
                      className="h-3.5 w-3.5 -rotate-90 opacity-60 transition-transform duration-200 group-open:rotate-0"
                    />
                  </summary>
                  <div className="flex flex-col gap-1 py-1 pl-3">
                    {productsMenu.map((category) => (
                      <details key={category._id} className="group/cat">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-1 rounded-lg px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-grey-100 [&::-webkit-details-marker]:hidden">
                          {category.name}
                          {/* eslint-disable-next-line @next/next/no-img-element -- static decorative SVG, never optimized per contract */}
                          <img
                            src="/global/header/chevron-down.svg"
                            alt=""
                            aria-hidden="true"
                            className="h-3 w-3 -rotate-90 opacity-60 transition-transform duration-200 group-open/cat:rotate-0"
                          />
                        </summary>
                        <div className="flex flex-col gap-1 py-1 pl-3">
                          {category.products.map((product) => (
                            <Link
                              key={product._id}
                              href={`/products/${category.slug}/${product.slug}`}
                              onClick={onClose}
                              className="flex flex-col gap-0.5 rounded-lg px-3 py-2 text-sm text-ink/80 transition-colors hover:bg-grey-100 hover:text-brand"
                            >
                              <span className="font-medium text-ink">{product.name}</span>
                              <span className="text-xs text-ink/60">{product.subtitle}</span>
                            </Link>
                          ))}
                        </div>
                      </details>
                    ))}
                  </div>
                </details>
              );
            }
            return (
              <a
                key={item.label}
                href={item.href}
                onClick={onClose}
                className="inline-flex items-center justify-between gap-1 rounded-lg px-3 py-3 text-base font-medium text-ink transition-colors hover:bg-grey-100"
              >
                {item.label}
                {item.showChevron && (
                  // eslint-disable-next-line @next/next/no-img-element -- static decorative SVG, never optimized per contract
                  <img
                    src="/global/header/chevron-down.svg"
                    alt=""
                    aria-hidden="true"
                    className="h-3.5 w-3.5 -rotate-90 opacity-60"
                  />
                )}
              </a>
            );
          })}
        </nav>

        <CmsButton button={ctaButton} variant="primary" size="md" className="mt-auto w-full" />
      </div>
    </div>,
    document.body
  );
}
