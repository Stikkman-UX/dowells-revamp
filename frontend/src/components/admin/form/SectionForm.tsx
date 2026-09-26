"use client";

import { useEffect, useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import type { Field } from "./types";
import { getAdminPageBrowser, saveSectionBrowser } from "@/lib/api/pages.client";
import { ApiError } from "@/lib/api/error";
import { useToast } from "@/components/admin/ui/Toast";
import { Switch } from "@/components/admin/ui/Switch";
import { Button } from "@/components/admin/ui/Button";
import { Badge } from "@/components/admin/ui/Badge";
import { ConfirmDialog } from "@/components/admin/ui/ConfirmDialog";
import { FieldRenderer } from "./FieldRenderer";
import { NoEditorConfigured } from "./NoEditorConfigured";
import { toStoredForm } from "./toStoredForm";
import { useUnsavedChangesGuard } from "./useUnsavedChangesGuard";
import { getIn, fieldDomId } from "./path";
import { initSectionFormState, sectionFormReducer } from "./sectionFormReducer";

type Props = {
  slug: string;
  sectionKey: string;
  label: string;
  formConfig: Field[];
  initial: { isVisible: boolean; data: unknown; rev: number };
};

export function SectionForm({ slug, sectionKey, label, formConfig, initial }: Props) {
  const [state, dispatch] = useReducer(sectionFormReducer, initial, initSectionFormState);
  const [collapsed, setCollapsed] = useState(true);
  const [confirmReload, setConfirmReload] = useState(false);
  const [reloading, setReloading] = useState(false);
  const toast = useToast();
  const router = useRouter();

  useUnsavedChangesGuard(state.dirty);

  // On a failed save, auto-expand this panel and focus/scroll to the first
  // invalid field. Errors keyed by dotted path map 1:1 to `field-<path>`
  // DOM ids set by every leaf field component.
  useEffect(() => {
    const errorPaths = Object.keys(state.errors);
    if (state.status !== "error" || errorPaths.length === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- expanding on a failed-save result is an external event, not derived render state
    setCollapsed(false);
    const id = fieldDomId(errorPaths[0]);
    const timer = window.setTimeout(() => {
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus?.();
    }, 60);
    return () => window.clearTimeout(timer);
  }, [state.errors, state.status]);

  async function handleSave() {
    dispatch({ type: "SAVE_START" });
    try {
      const storedData = toStoredForm(formConfig, state.data);
      const { section } = await saveSectionBrowser(slug, sectionKey, {
        isVisible: state.isVisible,
        data: storedData,
        rev: state.rev,
      });
      dispatch({ type: "SAVE_SUCCESS", data: section.data, isVisible: section.isVisible, rev: section.rev });
      toast.show("Saved — live now", "success");
      router.refresh();
    } catch (err) {
      handleSaveError(err);
    }
  }

  function handleSaveError(err: unknown) {
    if (!(err instanceof ApiError)) {
      dispatch({ type: "SAVE_OTHER_ERROR", message: "Could not reach the server." });
      toast.show("Network error while saving", "error");
      return;
    }
    if (err.status === 422 && err.errors) {
      const map: Record<string, string> = {};
      let orphanCount = 0;
      for (const e of err.errors) {
        if (e.path.startsWith("data.")) {
          map[e.path.slice(5)] = e.message;
        } else if (e.path === "data") {
          orphanCount++;
        } else {
          orphanCount++;
        }
      }
      dispatch({
        type: "SAVE_VALIDATION_ERROR",
        errors: map,
        message: orphanCount > 0 ? `${orphanCount} additional issue(s) reported outside this form.` : undefined,
      });
      return;
    }
    if (err.status === 409) {
      dispatch({ type: "SAVE_CONFLICT" });
      return;
    }
    dispatch({ type: "SAVE_OTHER_ERROR", message: err.message });
    toast.show(err.message, "error");
  }

  async function handleReloadConfirmed() {
    setReloading(true);
    try {
      const page = await getAdminPageBrowser<Record<string, { isVisible: boolean; data: unknown; rev: number }>>(
        slug
      );
      const section = page.sections[sectionKey];
      if (section) {
        dispatch({ type: "RELOAD", data: section.data, isVisible: section.isVisible, rev: section.rev });
        toast.show("Reloaded the latest saved version", "info");
      }
    } catch {
      toast.show("Could not reload this section", "error");
    } finally {
      setReloading(false);
      setConfirmReload(false);
    }
  }

  const errorCount = Object.keys(state.errors).length;

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
          <span className="text-sm font-semibold text-ink">{label}</span>
          {state.dirty && (
            <span aria-label="Unsaved changes" title="Unsaved changes" className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          )}
          {errorCount > 0 && (
            <Badge tone="danger">
              {errorCount} error{errorCount === 1 ? "" : "s"}
            </Badge>
          )}
        </button>
        <Switch
          id={`visible-${sectionKey}`}
          checked={state.isVisible}
          onChange={(v) => dispatch({ type: "SET_VISIBLE", value: v })}
          label="Visible on site"
        />
        <Button variant="secondary" size="sm" onClick={() => dispatch({ type: "RESET" })} disabled={!state.dirty || state.saving}>
          Reset
        </Button>
        <Button variant="primary" size="sm" onClick={handleSave} loading={state.saving}>
          Save
        </Button>
      </header>

      {!collapsed && (
        <div className="p-4">
          {state.status === "conflict" && (
            <div
              role="alert"
              className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800"
            >
              <span>This section was changed elsewhere.</span>
              <Button size="sm" variant="secondary" onClick={() => setConfirmReload(true)}>
                Reload
              </Button>
            </div>
          )}
          {state.status === "error" && state.errorMessage && (
            <div role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.errorMessage}
            </div>
          )}

          {formConfig.length === 0 ? (
            <NoEditorConfigured data={state.data} />
          ) : (
            <div className="space-y-4">
              {formConfig.map((field) => (
                <FieldRenderer
                  key={field.name}
                  field={field}
                  value={getIn(state.data, field.name)}
                  onChange={(v) => dispatch({ type: "SET_FIELD", name: field.name, value: v })}
                  path={field.name}
                  errors={state.errors}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmReload}
        title="Reload section"
        message="Discard your local edits and reload the latest saved version?"
        confirmLabel="Reload"
        danger
        loading={reloading}
        onConfirm={handleReloadConfirmed}
        onCancel={() => setConfirmReload(false)}
      />
    </section>
  );
}
