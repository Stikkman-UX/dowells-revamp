import type { Asset } from "@/types/cms";
import { browserApiFetch } from "./browser";

// Client Components only (the media form field). The frontend never talks
// to storage directly — every call goes through the backend, which is the
// whole asset API: upload, or overwrite an existing asset in place.

export function uploadAssetBrowser(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return browserApiFetch<{ asset: Asset }>("/admin/assets", {
    method: "POST",
    body: formData,
  });
}

export function replaceAssetBrowser(assetId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return browserApiFetch<{ asset: Asset }>(`/admin/assets/${assetId}`, {
    method: "PUT",
    body: formData,
  });
}
