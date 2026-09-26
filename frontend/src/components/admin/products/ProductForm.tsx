"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminCategory, AdminProduct, ProductInput } from "@/types/products";
import {
  createProductBrowser,
  deleteProductBrowser,
  getAdminProductBrowser,
  updateProductBrowser,
} from "@/lib/api/products.client";
import { ApiError } from "@/lib/api/error";
import { useToast } from "@/components/admin/ui/Toast";
import { Button } from "@/components/admin/ui/Button";
import { Switch } from "@/components/admin/ui/Switch";
import { ConfirmDialog } from "@/components/admin/ui/ConfirmDialog";
import { FieldRenderer } from "@/components/admin/form/FieldRenderer";
import { toStoredForm } from "@/components/admin/form/toStoredForm";
import { useUnsavedChangesGuard } from "@/components/admin/form/useUnsavedChangesGuard";
import { getIn, fieldDomId } from "@/components/admin/form/path";
import { initSectionFormState, sectionFormReducer } from "@/components/admin/form/sectionFormReducer";
import { buildProductFormConfig } from "./productFormConfig";
import { newProductDefaults, productToFormData, type ProductFormData } from "./defaults";

type Props =
  | { mode: "create"; categories: AdminCategory[] }
  | { mode: "edit"; categories: AdminCategory[]; product: AdminProduct };

/**
 * Product editor. Does NOT reuse `SectionForm` (that component is wired to
 * page saves, the `data.` error-path prefix and "Visible on site" — see
 * frontend/CLAUDE.md "Products module"). Composes the same engine instead:
 * `sectionFormReducer` (its `isVisible` slot carries `isPublished` here),
 * `FieldRenderer` + `getIn`/`fieldDomId`, `toStoredForm`,
 * `useUnsavedChangesGuard`, and the 409 conflict + Reload banner.
 */
export function ProductForm(props: Props) {
  const { categories, mode } = props;
  const router = useRouter();
  const toast = useToast();

  const [state, dispatch] = useReducer(
    sectionFormReducer,
    mode === "edit"
      ? {
          isVisible: props.product.isPublished,
          data: productToFormData(props.product) satisfies ProductFormData,
          rev: props.product.rev,
        }
      : {
          isVisible: false,
          data: newProductDefaults(categories[0]?._id ?? "") satisfies ProductFormData,
          rev: 0,
        },
    initSectionFormState
  );

  const formConfig = useMemo(() => buildProductFormConfig(categories), [categories]);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmReload, setConfirmReload] = useState(false);
  const [reloading, setReloading] = useState(false);

  useUnsavedChangesGuard(state.dirty);

  // On a failed save, scroll to and focus the first invalid field — errors
  // are body-relative (API_CONTRACT §6.3), so they map 1:1 onto `field-<path>`
  // ids without stripping a `data.` prefix the way SectionForm does.
  useEffect(() => {
    const errorPaths = Object.keys(state.errors);
    if (state.status !== "error" || errorPaths.length === 0) return;
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
      const stored = toStoredForm(formConfig, state.data) as Omit<ProductInput, "isPublished">;
      if (mode === "create") {
        const { product } = await createProductBrowser({ ...stored, isPublished: state.isVisible });
        toast.show("Product created", "success");
        router.replace(`/admin/products/${product._id}`);
        router.refresh();
        return;
      }
      const { product } = await updateProductBrowser(props.product._id, {
        ...stored,
        isPublished: state.isVisible,
        rev: state.rev,
      });
      dispatch({
        type: "SAVE_SUCCESS",
        data: productToFormData(product) satisfies ProductFormData,
        isVisible: product.isPublished,
        rev: product.rev,
      });
      toast.show("Saved", "success");
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
      // Body-relative paths (API_CONTRACT §6.3, no `data.` prefix): every
      // ProductInput field the backend can flag — including `categoryId` —
      // has a matching field in `buildProductFormConfig`, so no orphan
      // bucket is needed the way SectionForm needs one for stray `data`-only
      // issues.
      const map: Record<string, string> = {};
      for (const e of err.errors) map[e.path] = e.message;
      dispatch({ type: "SAVE_VALIDATION_ERROR", errors: map });
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
    if (mode !== "edit") return;
    setReloading(true);
    try {
      const { product } = await getAdminProductBrowser(props.product._id);
      dispatch({
        type: "RELOAD",
        data: productToFormData(product) satisfies ProductFormData,
        isVisible: product.isPublished,
        rev: product.rev,
      });
      toast.show("Reloaded the latest saved version", "info");
    } catch {
      toast.show("Could not reload this product", "error");
    } finally {
      setReloading(false);
      setConfirmReload(false);
    }
  }

  async function handleDeleteConfirmed() {
    if (mode !== "edit") return;
    setDeleting(true);
    try {
      await deleteProductBrowser(props.product._id);
      toast.show("Product deleted", "success");
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      toast.show(err instanceof ApiError ? err.message : "Could not delete this product", "error");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  const errorCount = Object.keys(state.errors).length;
  const heading = mode === "create" ? "New product" : props.product.name || "Edit product";

  return (
    <div>
      <div className="sticky top-0 z-10 mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-grey-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold text-ink">{heading}</h1>
          {errorCount > 0 && (
            <p className="text-xs text-red-600">
              {errorCount} error{errorCount === 1 ? "" : "s"} — see highlighted fields below
            </p>
          )}
        </div>
        <Switch
          id="product-published"
          checked={state.isVisible}
          onChange={(v) => dispatch({ type: "SET_VISIBLE", value: v })}
          label="Published"
        />
        <Button
          variant="secondary"
          onClick={() => dispatch({ type: "RESET" })}
          disabled={!state.dirty || state.saving}
        >
          Reset
        </Button>
        <Button variant="primary" onClick={handleSave} loading={state.saving}>
          Save
        </Button>
        {mode === "edit" && (
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            Delete
          </Button>
        )}
      </div>

      {state.status === "conflict" && (
        <div
          role="alert"
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800"
        >
          <span>This product was changed elsewhere.</span>
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

      {mode === "edit" && (
        <ConfirmDialog
          open={confirmDelete}
          title="Delete product"
          message={`Delete "${props.product.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          loading={deleting}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

      <ConfirmDialog
        open={confirmReload}
        title="Reload product"
        message="Discard your local edits and reload the latest saved version?"
        confirmLabel="Reload"
        danger
        loading={reloading}
        onConfirm={handleReloadConfirmed}
        onCancel={() => setConfirmReload(false)}
      />
    </div>
  );
}
