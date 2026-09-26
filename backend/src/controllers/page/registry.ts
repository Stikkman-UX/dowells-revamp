import { ZodTypeAny } from "zod";
import { OperationalError } from "@utils/error/errorInstances";
import { MESSAGES, STATUS_CODES } from "@src/constants";

import { headerSchema, headerDefaults } from "./sections/header.schema";
import { footerSchema, footerDefaults } from "./sections/footer.schema";
import { catalogueSchema, catalogueDefaults } from "./sections/catalogue.schema";
import { heroSchema, heroDefaults } from "./sections/hero.schema";
import { aboutSchema, aboutDefaults } from "./sections/about.schema";
import { quickAccessSchema, quickAccessDefaults } from "./sections/quickAccess.schema";
import { industriesSchema, industriesDefaults } from "./sections/industries.schema";
import {
  productCategoriesSchema,
  productCategoriesDefaults,
} from "./sections/productCategories.schema";
import { impactSchema, impactDefaults } from "./sections/impact.schema";
import { trustSchema, trustDefaults } from "./sections/trust.schema";
import { insightsSchema, insightsDefaults } from "./sections/insights.schema";

/**
 * The page-generic CMS registry (API_CONTRACT §4.2). This is the ONLY place
 * that may know about a concrete slug ("home", "_global") or section key —
 * every route, service and the seed script work purely off this table plus
 * whatever slug/key arrives on the request. Adding a page (About, Features,
 * Products, ...) later is a registry edit only.
 *
 * Insertion order of `sections` IS render order (object key order is
 * preserved by JS/JSON for string keys) — layout is not CMS-editable.
 */

export type PageKind = "page" | "global";

export type SectionDefinition = {
  schema: ZodTypeAny;
  /** A structurally valid, empty value for this section — used by the admin
   *  GET for a section that has never been saved (rev: 0). */
  defaults: () => unknown;
};

export type PageDefinition = {
  title: string;
  kind: PageKind;
  path: string | null;
  sections: Record<string, SectionDefinition>;
};

export const pageRegistry: Record<string, PageDefinition> = {
  _global: {
    title: "Site-wide (Header, Footer & Catalogue)",
    kind: "global",
    path: null,
    sections: {
      header: { schema: headerSchema, defaults: headerDefaults },
      footer: { schema: footerSchema, defaults: footerDefaults },
      catalogue: { schema: catalogueSchema, defaults: catalogueDefaults },
    },
  },
  home: {
    title: "Home",
    kind: "page",
    path: "/",
    sections: {
      hero: { schema: heroSchema, defaults: heroDefaults },
      about: { schema: aboutSchema, defaults: aboutDefaults },
      quickAccess: { schema: quickAccessSchema, defaults: quickAccessDefaults },
      industries: { schema: industriesSchema, defaults: industriesDefaults },
      productCategories: {
        schema: productCategoriesSchema,
        defaults: productCategoriesDefaults,
      },
      impact: { schema: impactSchema, defaults: impactDefaults },
      trust: { schema: trustSchema, defaults: trustDefaults },
      insights: { schema: insightsSchema, defaults: insightsDefaults },
    },
  },
};

/** Registry order, e.g. for GET /admin/pages (API_CONTRACT §4.3). */
export const registeredSlugs: string[] = Object.keys(pageRegistry);

/** 404 pageNotFound for any slug not in the registry. */
export const getPageDefinition = (slug: string): PageDefinition => {
  const definition = pageRegistry[slug];

  if (!definition) {
    throw new OperationalError(STATUS_CODES.NOT_FOUND, MESSAGES.pageNotFound);
  }

  return definition;
};

/**
 * 404 pageNotFound / sectionNotFound. Guards `key` against the registry
 * BEFORE it is ever used to build a Mongo dotted path — the only keys that
 * pass this check are the fixed, hardcoded strings baked into the registry
 * above, never arbitrary request input.
 */
export const getSectionDefinition = (slug: string, key: string): SectionDefinition => {
  const page = getPageDefinition(slug);
  const section = page.sections[key];

  if (!section) {
    throw new OperationalError(STATUS_CODES.NOT_FOUND, MESSAGES.sectionNotFound);
  }

  return section;
};
