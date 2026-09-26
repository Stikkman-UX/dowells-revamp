"use client";

import { forwardRef } from "react";
import type { Field } from "../types";
import { FieldRenderer } from "../FieldRenderer";
import { getIn, hasErrorUnder } from "../path";
import { Badge } from "@/components/admin/ui/Badge";

type Props = {
  index: number;
  item: unknown;
  fields: Field[];
  itemLabel: string;
  path: string;
  errors: Record<string, string>;
  collapsed: boolean;
  onToggle: () => void;
  onFieldChange: (childName: string, value: unknown) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canRemove: boolean;
};

export const RepeaterRow = forwardRef<HTMLButtonElement, Props>(function RepeaterRow(
  {
    index,
    item,
    fields,
    itemLabel,
    path,
    errors,
    collapsed,
    onToggle,
    onFieldChange,
    onRemove,
    onMoveUp,
    onMoveDown,
    canMoveUp,
    canMoveDown,
    canRemove,
  },
  ref
) {
  // The label field may be a plain string (or a dotted path to one, e.g.
  // `media.alt`), or a HighlightText / Button object whose readable part
  // lives under `text`.
  const rawTitle = getIn(item, itemLabel);
  const titleValue =
    rawTitle && typeof rawTitle === "object" && "text" in rawTitle
      ? (rawTitle as { text: unknown }).text
      : rawTitle;
  const title = typeof titleValue === "string" && titleValue.trim() ? titleValue : `Item ${index + 1}`;
  const rowHasError = hasErrorUnder(errors, path);

  return (
    <div className="rounded-md border border-grey-200">
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          ref={ref}
          type="button"
          onClick={onToggle}
          aria-expanded={!collapsed}
          className="flex flex-1 items-center gap-2 text-left text-sm font-medium text-ink"
        >
          <span aria-hidden="true" className={`transition-transform ${collapsed ? "" : "rotate-90"}`}>
            ▸
          </span>
          <span className="truncate">{title}</span>
          {rowHasError && <Badge tone="danger">Error</Badge>}
        </button>
        <button
          type="button"
          onClick={onMoveUp}
          disabled={!canMoveUp}
          aria-label={`Move ${title} up`}
          className="rounded p-1.5 text-grey-500 hover:bg-grey-100 disabled:opacity-30"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={!canMoveDown}
          aria-label={`Move ${title} down`}
          className="rounded p-1.5 text-grey-500 hover:bg-grey-100 disabled:opacity-30"
        >
          ↓
        </button>
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          aria-label={`Remove ${title}`}
          className="rounded p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-30"
        >
          ✕
        </button>
      </div>

      {!collapsed && (
        <div className="space-y-3 border-t border-grey-100 p-3">
          {fields.map((child) => (
            <FieldRenderer
              key={child.name}
              field={child}
              value={getIn(item, child.name)}
              onChange={(v) => onFieldChange(child.name, v)}
              path={`${path}.${child.name}`}
              errors={errors}
            />
          ))}
        </div>
      )}
    </div>
  );
});
