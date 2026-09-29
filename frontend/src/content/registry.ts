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
import Footer from "@/components/global/footer";
import CatalogueCard from "@/components/global/catalogue";

import Hero from "@/components/home/hero";
import About from "@/components/home/about";
import QuickAccess from "@/components/home/quick-access";
import Industries from "@/components/home/industries";
import ProductCategories from "@/components/home/product-categories";
import Impact from "@/components/home/impact";
import Trust from "@/components/home/trust";
import Insights from "@/components/home/insights";
import { formRegistry } from "./formRegistry";

/**
 * The CMS is page-generic: this file is the ONE place that maps a page
 * slug + section key to { label, Component, formConfig }. Home is
 * only the first registered page. To add a future page (About, Features,
 * Products, ...):
 *   1. Create its section folders under src/components/<page>/<section>/
 *      (index.tsx, form.config.ts — same stub shape as home's), and seed its
 *      content in backend/seed/content.json.
 *   2. Add one entry to `pageRegistry` below, importing those
 *      Component/formConfig exports.
 *   3. Add a route file under src/app/(public)/<page>/page.tsx that calls
 *      `getPageContent("<page>")` and renders `entry.sections[key].Component`
 *      for each key in `content.sections`, in registry order.
 * Nothing else (routing, layout, the admin dashboard) should ever
 * hardcode "home" — it should all be driven off this registry.
 */

type SectionRegistryEntry<TData> = {
  label: string;
  Component: ComponentType<{ data: TData }>;
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
        formConfig: formRegistry._global.header,
      },
      footer: {
        label: "Footer",
        Component: Footer,
        formConfig: formRegistry._global.footer,
      },
      catalogue: {
        label: "Catalogue (product PDF)",
        Component: CatalogueCard,
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
        formConfig: formRegistry.home.hero,
      },
      about: {
        label: "About",
        Component: About,
        formConfig: formRegistry.home.about,
      },
      quickAccess: {
        label: "Quick Access",
        Component: QuickAccess,
        formConfig: formRegistry.home.quickAccess,
      },
      industries: {
        label: "Industries",
        Component: Industries,
        formConfig: formRegistry.home.industries,
      },
      productCategories: {
        label: "Product Categories",
        Component: ProductCategories,
        formConfig: formRegistry.home.productCategories,
      },
      impact: {
        label: "Impact",
        Component: Impact,
        formConfig: formRegistry.home.impact,
      },
      trust: {
        label: "Trust",
        Component: Trust,
        formConfig: formRegistry.home.trust,
      },
      insights: {
        label: "Insights",
        Component: Insights,
        formConfig: formRegistry.home.insights,
      },
    },
  } satisfies PageRegistryEntry<HomeSections>,
} as const;

export type PageSlug = keyof typeof pageRegistry;

type SectionDataOf<TEntry> = TEntry extends SectionRegistryEntry<infer TData>
  ? TData
  : never;

/** Hidden, never-saved or unavailable sections resolve to `null`. */
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
 * Fetches a registered page. The backend is the ONLY source of content —
 * there are no frontend defaults: a section that is hidden
 * (`isVisible === false`), was never saved, or couldn't be fetched resolves
 * to `null` and is not rendered. Never throws: `serverPublicFetch` already
 * swallows all failures, so a backend outage renders the page shell without
 * its CMS sections rather than an error.
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
    const apiSection = api?.sections?.[key] as PublicSection<unknown> | undefined;
    sections[key] = apiSection?.isVisible === true ? apiSection.data : null;
  }

  return {
    slug,
    title: api?.title ?? entry.title,
    seo: api?.seo ?? null,
    updatedAt: api?.updatedAt ?? null,
    sections: sections as PageContentSections<TSlug>,
  };
}
