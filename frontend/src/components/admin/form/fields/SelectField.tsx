"use client";

import type { FieldProps } from "../types";
import { fieldDomId } from "../path";
import { FieldLabel, FieldError } from "./shared";

export function SelectField({ field, value, onChange, path, errors }: FieldProps) {
  if (field.kind !== "select") return null;
  const id = fieldDomId(path);
  const errorId = `${id}-error`;
  const error = errors[path];

  return (
    <div>
      <FieldLabel htmlFor={id} label={field.label} help={field.help} />
      <select
        id={id}
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/40 ${
          error ? "border-red-400" : "border-grey-300"
        }`}
      >
        {field.options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <FieldError id={errorId} message={error} />
    </div>
  );
}
