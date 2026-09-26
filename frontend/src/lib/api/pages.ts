import "server-only";
import type {
  AdminPageListItem,
  AdminPageResponse,
  PublicPageResponse,
} from "@/types/cms";
import { serverApiFetch, serverPublicFetch } from "./server";

// Server Components only. Client Components use `./pages.client`.

/** Returns null on any failure; callers fall back to built-in defaults. */
export function getPublicPage<TSections extends Record<string, unknown>>(
  slug: string
) {
  return serverPublicFetch<PublicPageResponse<TSections>>(`/pages/${slug}`);
}

export function listAdminPages() {
  return serverApiFetch<{ pages: AdminPageListItem[] }>("/admin/pages");
}

export function getAdminPage<TSections extends Record<string, unknown>>(
  slug: string
) {
  return serverApiFetch<AdminPageResponse<TSections>>(`/admin/pages/${slug}`);
}
