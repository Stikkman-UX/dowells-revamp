"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { HeaderData } from "@/types/cms";
import type { PublicCategory } from "@/types/products";
import { Container } from "@/components/ui/Container";
import { CmsMedia } from "@/components/ui/CmsMedia";
import { CmsButton } from "@/components/ui/CmsButton";
import MobileDrawer from "./MobileDrawer";
import ProductsMenu from "./ProductsMenu";

type HeaderBarProps = { data: HeaderData; productsMenu: PublicCategory[] | null };

/** The "Products" nav item is keyed off its `href`, not its label. */
function isProductsLink(href: string) {
  return href.replace(/\/$/, "") === "/products";
}

export default function HeaderBar({ data, productsMenu }: HeaderBarProps) {
  const { logo, logoHref, navItems, showSearch, searchHref, ctaButton } = data;
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 w-full bg-white/95 backdrop-blur transition-[box-shadow,border-color] duration-200 ${
        scrolled ? "border-b border-ink/10 shadow-[0_1px_3px_rgba(0,0,0,0.04)]" : "border-b border-transparent"
      }`}
    >
      <Container className="flex h-16 items-center justify-between gap-6 lg:h-[4.3125rem]">
        <Link
          href={logoHref || "/"}
          className="relative block h-10 w-[5.625rem] shrink-0 lg:h-16 lg:w-[7.5rem]"
        >
          {logo ? (
            <CmsMedia media={logo} sizes="120px" objectFit="contain" alt={logo.alt || "Dowell's"} />
          ) : (
            <span className="text-lg font-semibold text-ink">Dowell&apos;s</span>
          )}
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-[1.375rem] lg:flex">
          {navItems.map((item) => {
            if (isProductsLink(item.href) && productsMenu && productsMenu.length > 0) {
              return <ProductsMenu key={item.label} item={item} categories={productsMenu} />;
            }
            return (
              <a
                key={item.label}
                href={item.href}
                className="inline-flex items-center gap-1 text-sm font-medium text-[#404040] transition-colors hover:text-brand"
              >
                {item.label}
                {item.showChevron && (
                  // eslint-disable-next-line @next/next/no-img-element -- static decorative SVG, never optimized per contract
                  <img
                    src="/global/header/chevron-down.svg"
                    alt=""
                    aria-hidden="true"
                    className="h-3.5 w-3.5"
                  />
                )}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {showSearch && (
            <a
              href={searchHref}
              aria-label="Search"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#404040] transition-colors hover:bg-grey-100 lg:h-10 lg:w-10"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- static decorative SVG, never optimized per contract */}
              <img
                src="/global/header/search.svg"
                alt=""
                aria-hidden="true"
                className="h-4 w-4 lg:h-[1.125rem] lg:w-[1.125rem]"
              />
            </a>
          )}

          <CmsButton
            button={ctaButton}
            variant="primary"
            size="sm"
            className="hidden lg:inline-flex"
          />

          <button
            type="button"
            aria-expanded={drawerOpen}
            aria-controls="mobile-nav-drawer"
            aria-label={drawerOpen ? "Close menu" : "Open menu"}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-grey-100 lg:hidden"
            onClick={() => setDrawerOpen((open) => !open)}
          >
            <span aria-hidden="true" className="relative block h-3.5 w-4">
              <span
                className={`absolute left-0 top-0 h-[1.5px] w-full origin-center bg-current transition-transform duration-200 ${
                  drawerOpen ? "translate-y-[6.5px] rotate-45" : ""
                }`}
              />
              <span
                className={`absolute left-0 top-1/2 h-[1.5px] w-full -translate-y-1/2 bg-current transition-opacity duration-200 ${
                  drawerOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute bottom-0 left-0 h-[1.5px] w-full origin-center bg-current transition-transform duration-200 ${
                  drawerOpen ? "-translate-y-[6.5px] -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>
      </Container>

      <MobileDrawer
        id="mobile-nav-drawer"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        navItems={navItems}
        productsMenu={productsMenu}
        ctaButton={ctaButton}
      />
    </header>
  );
}
