import "server-only";
import type { ComponentType } from "react";
import { serverPublicFetch } from "@/lib/api/server";
import type {
  GlobalSections,
  HomeSections,
  PageKind,
  PublicPageResponse,
  PublicSection,
  ResolvedSeo,
} from "@/types/cms";
import type { Field } from "@/components/admin/form/types";

import Header from "@/components/global/header";
import { defaults as headerDefaults } from "@/components/global/header/default";
import Footer from "@/components/global/footer";
import { defaults as footerDefaults } from "@/components/global/footer/default";
import CatalogueCard from "@/components/global/catalogue";
import { defaults as catalogueDefaults } from "@/components/global/catalogue/default";

import Hero from "@/components/home/hero";
import { defaults as heroDefaults } from "@/components/home/hero/default";
import About from "@/components/home/about";
import { defaults as aboutDefaults } from "@/components/home/about/default";
import QuickAccess from "@/components/home/quick-access";
import { defaults as quickAccessDefaults } from "@/components/home/quick-access/default";
import Industries from "@/components/home/industries";
import { defaults as industriesDefaults } from "@/components/home/industries/default";
import ProductCategories from "@/components/home/product-categories";
import { defaults as productCategoriesDefaults } from "@/components/home/product-categories/default";
import Impact from "@/components/home/impact";
import { defaults as impactDefaults } from "@/components/home/impact/default";
import Trust from "@/components/home/trust";
import { defaults as trustDefaults } from "@/components/home/trust/default";
import Insights from "@/components/home/insights";
import { defaults as insightsDefaults } from "@/components/home/insights/default";
import { formRegistry } from "./formRegistry";

/**
 * The CMS is page-generic: this file is the ONE place that maps a page
 * slug + section key to { label, Component, defaults, formConfig }. Home is
 * only the first registered page. To add a future page (About, Features,
 * Products, ...):
 *   1. Create its section folders under src/components/<page>/<section>/
 *      (index.tsx, default.ts, form.config.ts — same stub shape as home's).
 *   2. Add one entry to `pageRegistry` below, importing those
 *      Component/defaults/formConfig exports.
 *   3. Add a route file under src/app/(public)/<page>/page.tsx that calls
 *      `getPageContent("<page>")` and renders `entry.sections[key].Component`
 *      for each key in `content.sections`, in registry order.
 * Nothing else (routing, layout, the admin dashboard) should ever
 * hardcode "home" — it should all be driven off this registry.
 */

type SectionRegistryEntry<TData> = {
  label: string;
  Component: ComponentType<{ data: TData }>;
  defaults: TData;
  formConfig: Field[];
};

type PageRegistryEntry<TSections extends Record<string, unknown>> = {
  title: string;
  kind: PageKind;
  path: string;
  sections: { [K in keyof TSections]: SectionRegistryEntry<TSections[K]> };
};

export const pageRegistry = {
  _global: {
    title: "Site-wide (Header, Footer & Catalogue)",
    kind: "global",
    path: "",
    sections: {
      header: {
        label: "Header",
        Component: Header,
        defaults: headerDefaults,
        formConfig: formRegistry._global.header,
      },
      footer: {
        label: "Footer",
        Component: Footer,
        defaults: footerDefaults,
        formConfig: formRegistry._global.footer,
      },
      catalogue: {
        label: "Catalogue (product PDF)",
        Component: CatalogueCard,
        defaults: catalogueDefaults,
        formConfig: formRegistry._global.catalogue,
      },
    },
  } satisfies PageRegistryEntry<GlobalSections>,

  home: {
    title: "Home",
    kind: "page",
    path: "/",
    sections: {
      hero: {
        label: "Hero",
        Component: Hero,
        defaults: heroDefaults,
        formConfig: formRegistry.home.hero,
      },
      about: {
        label: "About",
        Component: About,
        defaults: aboutDefaults,
        formConfig: formRegistry.home.about,
      },
      quickAccess: {
        label: "Quick Access",
        Component: QuickAccess,
        defaults: quickAccessDefaults,
        formConfig: formRegistry.home.quickAccess,
      },
      industries: {
        label: "Industries",
        Component: Industries,
        defaults: industriesDefaults,
        formConfig: formRegistry.home.industries,
      },
      productCategories: {
        label: "Product Categories",
        Component: ProductCategories,
        defaults: productCategoriesDefaults,
        formConfig: formRegistry.home.productCategories,
      },
      impact: {
        label: "Impact",
        Component: Impact,
        defaults: impactDefaults,
        formConfig: formRegistry.home.impact,
      },
      trust: {
        label: "Trust",
        Component: Trust,
        defaults: trustDefaults,
        formConfig: formRegistry.home.trust,
      },
      insights: {
        label: "Insights",
        Component: Insights,
        defaults: insightsDefaults,
        formConfig: formRegistry.home.insights,
      },
    },
  } satisfies PageRegistryEntry<HomeSections>,
} as const;

export type PageSlug = keyof typeof pageRegistry;

type SectionDataOf<TEntry> = TEntry extends SectionRegistryEntry<infer TData>
  ? TData
  : never;

/** Hidden sections (`isVisible === false`) resolve to `null`. */
export type PageContentSections<TSlug extends PageSlug> = {
  [K in keyof (typeof pageRegistry)[TSlug]["sections"]]: SectionDataOf<
    (typeof pageRegistry)[TSlug]["sections"][K]
  > | null;
};

export type PageContent<TSlug extends PageSlug> = {
  slug: TSlug;
  title: string;
  seo: ResolvedSeo | null;
  updatedAt: string | null;
  sections: PageContentSections<TSlug>;
};

/**
 * Fetches a registered page and applies the contract's PER-SECTION
 * fallback (API_CONTRACT.md §5): `api.sections[key]?.data ?? defaults[key]`,
 * `isVisible === false` -> section omitted (null) from the result. There is
 * no deep merge — a saved section's data replaces its defaults wholesale.
 * Never throws: `serverPublicFetch` already swallows all failures, so on
 * any backend outage every section simply falls back to its defaults.
 */
export async function getPageContent<TSlug extends PageSlug>(
  slug: TSlug
): Promise<PageContent<TSlug>> {
  const entry = pageRegistry[slug];
  const api = await serverPublicFetch<PublicPageResponse<Record<string, unknown>>>(
    `/pages/${slug}`
  );

  const sections = {} as Record<string, unknown>;

  for (const key of Object.keys(entry.sections)) {
    const sectionEntry = (
      entry.sections as Record<string, SectionRegistryEntry<unknown>>
    )[key];
    const apiSection = api?.sections?.[key] as PublicSection<unknown> | undefined;

    if (apiSection && apiSection.isVisible === false) {
      sections[key] = null;
    } else if (apiSection && apiSection.isVisible === true) {
      sections[key] = apiSection.data;
    } else {
      sections[key] = sectionEntry.defaults;
    }
  }

  return {
    slug,
    title: api?.title ?? entry.title,
    seo: api?.seo ?? null,
    updatedAt: api?.updatedAt ?? null,
    sections: sections as PageContentSections<TSlug>,
  };
}
