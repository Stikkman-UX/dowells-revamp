import type {
  AdminPageResponse,
  AdminSection,
  ResolvedSeo,
  Seo,
} from "@/types/cms";
import { browserApiFetch } from "./browser";

// Client Components only (section editor, SEO form). Server code uses `./pages`.

/** Re-fetches a page from the browser, e.g. after a 409 stale-revision conflict. */
export function getAdminPageBrowser<TSections extends Record<string, unknown>>(
  slug: string
) {
  return browserApiFetch<AdminPageResponse<TSections>>(`/admin/pages/${slug}`);
}

export function saveSectionBrowser<TData>(
  slug: string,
  key: string,
  body: { isVisible: boolean; data: TData; rev: number }
) {
  return browserApiFetch<{ section: AdminSection<TData> }>(
    `/admin/pages/${slug}/sections/${key}`,
    { method: "PUT", body }
  );
}

export function saveSeoBrowser(slug: string, body: Seo) {
  return browserApiFetch<{ seo: ResolvedSeo }>(`/admin/pages/${slug}/seo`, {
    method: "PUT",
    body,
  });
}
