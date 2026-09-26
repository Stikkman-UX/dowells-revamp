"use client";

import type { FieldProps } from "../types";
import { Input } from "@/components/admin/ui/Input";
import { Textarea } from "@/components/admin/ui/Textarea";
import { fieldDomId } from "../path";
import { FieldLabel, FieldError } from "./shared";

const URL_HINT =
  "Allowed: a relative path (/path), a #anchor, or an absolute https://, mailto: or tel: link. Leave empty for no link.";

/** Handles the shared `{ kind: "text" | "textarea" | "url" }` field variant. */
export function TextLikeField({ field, value, onChange, path, errors }: FieldProps) {
  if (field.kind !== "text" && field.kind !== "textarea" && field.kind !== "url") return null;
  const id = fieldDomId(path);
  const errorId = `${id}-error`;
  const error = errors[path];
  const help = field.kind === "url" ? [field.help, URL_HINT].filter(Boolean).join(" ") : field.help;
  const stringValue = typeof value === "string" ? value : "";

  return (
    <div>
      <FieldLabel htmlFor={id} label={field.label} help={help} />
      {field.kind === "textarea" ? (
        <Textarea
          id={id}
          rows={4}
          value={stringValue}
          maxLength={field.maxLength}
          onChange={(e) => onChange(e.target.value)}
          invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        />
      ) : (
        <Input
          id={id}
          type={field.kind === "url" ? "text" : "text"}
          value={stringValue}
          maxLength={field.maxLength}
          onChange={(e) => onChange(e.target.value)}
          invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        />
      )}
      <FieldError id={errorId} message={error} />
    </div>
  );
}
