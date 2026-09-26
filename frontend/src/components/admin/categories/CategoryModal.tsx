"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { AdminCategory, CategoryInput } from "@/types/products";
import { createCategoryBrowser, updateCategoryBrowser } from "@/lib/api/products.client";
import { ApiError } from "@/lib/api/error";
import { useToast } from "@/components/admin/ui/Toast";
import { Modal } from "@/components/admin/ui/Modal";
import { Input } from "@/components/admin/ui/Input";
import { Textarea } from "@/components/admin/ui/Textarea";
import { Button } from "@/components/admin/ui/Button";
import { FieldLabel, FieldError } from "@/components/admin/form/fields/shared";

type Props = {
  open: boolean;
  editing: AdminCategory | null;
  onClose: () => void;
  onSaved: () => void;
};

const EMPTY_FORM: CategoryInput = { name: "", slug: "", description: "" };

/** Mirrors the backend's slug rule (`^[a-z0-9]+(?:-[a-z0-9]+)*$`) closely enough for a live suggestion — the server is the validation authority. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Create/edit form for a Category — table, reorder and delete live in `CategoriesManager`. */
export function CategoryModal({ open, editing, onClose, onSaved }: Props) {
  const toast = useToast();
  const [form, setForm] = useState<CategoryInput>(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    // Reinitialising the form when the modal opens (or switches between
    // create/edit) is an external event, not state derivable at render time.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- opening the modal for a different `editing` target resets the form, mirrors SectionForm/SeoForm's reset-on-external-event effects
    setForm(
      editing
        ? { name: editing.name, slug: editing.slug, description: editing.description }
        : EMPTY_FORM
    );
    // Editing an existing category never auto-slugifies from the name.
    setSlugTouched(Boolean(editing));
    setErrors({});
    setErrorMessage(null);
  }, [open, editing]);

  function handleNameChange(name: string) {
    setForm((prev) => ({ ...prev, name, slug: slugTouched ? prev.slug : slugify(name) }));
  }

  function handleSlugChange(slug: string) {
    setSlugTouched(true);
    setForm((prev) => ({ ...prev, slug }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setErrorMessage(null);
    try {
      if (editing) {
        await updateCategoryBrowser(editing._id, { ...form, rev: editing.rev });
      } else {
        await createCategoryBrowser(form);
      }
      toast.show(editing ? "Category updated" : "Category created", "success");
      onSaved();
    } catch (err) {
      if (err instanceof ApiError && err.status === 422 && err.errors) {
        const map: Record<string, string> = {};
        for (const e2 of err.errors) map[e2.path] = e2.message;
        setErrors(map);
      } else if (err instanceof ApiError) {
        // 409: slug taken, or a stale rev on an edit — the server message says which.
        toast.show(err.message, "error");
      } else {
        setErrorMessage("Could not reach the server.");
        toast.show("Network error while saving", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit category" : "New category"} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div>
          <FieldLabel htmlFor="category-name" label="Name" />
          <Input
            id="category-name"
            value={form.name}
            maxLength={200}
            required
            invalid={Boolean(errors.name)}
            onChange={(e) => handleNameChange(e.target.value)}
          />
          <FieldError id="category-name-error" message={errors.name} />
        </div>

        <div>
          <FieldLabel
            htmlFor="category-slug"
            label="Slug"
            help="lowercase letters, numbers and hyphens; changing it changes product URLs"
          />
          <Input
            id="category-slug"
            value={form.slug}
            required
            invalid={Boolean(errors.slug)}
            onChange={(e) => handleSlugChange(e.target.value)}
          />
          <FieldError id="category-slug-error" message={errors.slug} />
        </div>

        <div>
          <FieldLabel htmlFor="category-description" label="Description" />
          <Textarea
            id="category-description"
            rows={3}
            maxLength={1000}
            value={form.description}
            invalid={Boolean(errors.description)}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          />
          <FieldError id="category-description-error" message={errors.description} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={saving}>
            {editing ? "Save" : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
