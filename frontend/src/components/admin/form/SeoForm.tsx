"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ResolvedSeo, Media } from "@/types/cms";
import { saveSeoBrowser } from "@/lib/api/pages.client";
import { ApiError } from "@/lib/api/error";
import { useToast } from "@/components/admin/ui/Toast";
import { Input } from "@/components/admin/ui/Input";
import { Textarea } from "@/components/admin/ui/Textarea";
import { Switch } from "@/components/admin/ui/Switch";
import { Button } from "@/components/admin/ui/Button";
import { MediaField } from "./fields/MediaField";
import type { Field } from "./types";
import { fieldDomId } from "./path";
import { useUnsavedChangesGuard } from "./useUnsavedChangesGuard";

const OG_IMAGE_FIELD: Field = {
  name: "ogImage",
  label: "Social share image",
  kind: "media",
  accept: "image",
  help: "Shown when this page is shared on social platforms.",
};

export function SeoForm({ slug, initial }: { slug: string; initial: ResolvedSeo }) {
  const [collapsed, setCollapsed] = useState(true);
  const [data, setData] = useState<ResolvedSeo>(initial);
  const [saved, setSaved] = useState<ResolvedSeo>(initial);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const toast = useToast();
  const router = useRouter();

  const dirty = JSON.stringify(data) !== JSON.stringify(saved);
  useUnsavedChangesGuard(dirty);

  useEffect(() => {
    const paths = Object.keys(errors);
    if (paths.length === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- expanding on a failed-save result is an external event, not derived render state
    setCollapsed(false);
    const id = fieldDomId(paths[0]);
    const timer = window.setTimeout(() => {
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus?.();
    }, 60);
    return () => window.clearTimeout(timer);
  }, [errors]);

  function set<K extends keyof ResolvedSeo>(key: K, value: ResolvedSeo[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setErrors({});
    setErrorMessage(null);
    try {
      const ogImage: Media = data.ogImage ? { assetId: data.ogImage.assetId, alt: data.ogImage.alt } : null;
      const { seo } = await saveSeoBrowser(slug, {
        title: data.title,
        description: data.description,
        canonical: data.canonical,
        noindex: data.noindex,
        ogImage,
      });
      setData(seo);
      setSaved(seo);
      toast.show("Saved — live now", "success");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 422 && err.errors) {
        const map: Record<string, string> = {};
        for (const e of err.errors) map[e.path] = e.message;
        setErrors(map);
      } else if (err instanceof ApiError) {
        setErrorMessage(err.message);
        toast.show(err.message, "error");
      } else {
        setErrorMessage("Could not reach the server.");
        toast.show("Network error while saving", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setData(saved);
    setErrors({});
    setErrorMessage(null);
  }

  const titleId = fieldDomId("title");
  const descId = fieldDomId("description");
  const canonicalId = fieldDomId("canonical");

  return (
    <section className="mb-4 rounded-lg border border-grey-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-center gap-3 border-b border-grey-100 px-4 py-3">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <span aria-hidden="true" className={`inline-block transition-transform ${collapsed ? "" : "rotate-90"}`}>
            ▸
          </span>
          <span className="text-sm font-semibold text-ink">SEO</span>
          {dirty && <span aria-label="Unsaved changes" className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
        </button>
        <Button variant="secondary" size="sm" onClick={handleReset} disabled={!dirty || saving}>
          Reset
        </Button>
        <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
          Save
        </Button>
      </header>

      {!collapsed && (
        <div className="space-y-4 p-4">
          {errorMessage && (
            <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <div>
            <label htmlFor={titleId} className="mb-1.5 block text-sm font-medium text-ink">
              Title
            </label>
            <Input id={titleId} value={data.title} onChange={(e) => set("title", e.target.value)} invalid={Boolean(errors.title)} />
            <p className="mt-1 text-xs text-grey-400">{data.title.length}/60 characters (guidance only)</p>
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
          </div>

          <div>
            <label htmlFor={descId} className="mb-1.5 block text-sm font-medium text-ink">
              Description
            </label>
            <Textarea
              id={descId}
              rows={3}
              value={data.description}
              onChange={(e) => set("description", e.target.value)}
              invalid={Boolean(errors.description)}
            />
            <p className="mt-1 text-xs text-grey-400">{data.description.length}/160 characters (guidance only)</p>
            {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
          </div>

          <div>
            <label htmlFor={canonicalId} className="mb-1.5 block text-sm font-medium text-ink">
              Canonical URL
            </label>
            <Input
              id={canonicalId}
              value={data.canonical}
              onChange={(e) => set("canonical", e.target.value)}
              invalid={Boolean(errors.canonical)}
            />
            {errors.canonical && <p className="mt-1 text-xs text-red-600">{errors.canonical}</p>}
          </div>

          <Switch checked={data.noindex} onChange={(v) => set("noindex", v)} label="Hide from search engines (noindex)" />

          <MediaField
            field={OG_IMAGE_FIELD}
            value={data.ogImage}
            onChange={(v) => set("ogImage", v as ResolvedSeo["ogImage"])}
            path="ogImage"
            errors={errors}
          />
        </div>
      )}
    </section>
  );
}
