"use client";

import type { FieldProps } from "../types";
import { FieldRenderer } from "../FieldRenderer";
import { getIn, setIn } from "../path";

export function GroupField({ field, value, onChange, path, errors }: FieldProps) {
  if (field.kind !== "group") return null;
  const obj = value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  return (
    <fieldset className="rounded-md border border-grey-200 p-3">
      <legend className="px-1 text-sm font-medium text-ink">{field.label}</legend>
      {field.help && <p className="mb-2 text-xs text-grey-500">{field.help}</p>}
      <div className="space-y-3">
        {field.fields.map((child) => (
          <FieldRenderer
            key={child.name}
            field={child}
            value={getIn(obj, child.name)}
            onChange={(v) => onChange(setIn(obj, child.name, v))}
            path={`${path}.${child.name}`}
            errors={errors}
          />
        ))}
      </div>
    </fieldset>
  );
}
