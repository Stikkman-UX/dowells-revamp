import type { Field } from "@/components/admin/form/types";
import { formConfig as header } from "@/components/global/header/form.config";
import { formConfig as footer } from "@/components/global/footer/form.config";
import { formConfig as catalogue } from "@/components/global/catalogue/form.config";
import { formConfig as hero } from "@/components/home/hero/form.config";
import { formConfig as about } from "@/components/home/about/form.config";
import { formConfig as quickAccess } from "@/components/home/quick-access/form.config";
import { formConfig as industries } from "@/components/home/industries/form.config";
import { formConfig as productCategories } from "@/components/home/product-categories/form.config";
import { formConfig as impact } from "@/components/home/impact/form.config";
import { formConfig as trust } from "@/components/home/trust/form.config";
import { formConfig as insights } from "@/components/home/insights/form.config";

/**
 * Editor form configs by page slug + section key. CLIENT-SAFE on purpose:
 * it imports only `form.config.ts` files (plain data + `newItem` factories),
 * never section Components or the server-only API layer.
 *
 * Form configs contain functions, so they can never cross the Server ->
 * Client Component boundary as props. Client editors look them up here;
 * `registry.ts` re-uses this map so each page's forms are registered once.
 */
export const formRegistry = {
  _global: { header, footer, catalogue },
  home: {
    hero,
    about,
    quickAccess,
    industries,
    productCategories,
    impact,
    trust,
    insights,
  },
} satisfies Record<string, Record<string, Field[]>>;

export function getFormConfig(slug: string, sectionKey: string): Field[] {
  const page = (formRegistry as Record<string, Record<string, Field[]>>)[slug];
  return page?.[sectionKey] ?? [];
}
