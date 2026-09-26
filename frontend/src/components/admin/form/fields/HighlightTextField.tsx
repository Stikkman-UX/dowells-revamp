"use client";

import type { HighlightText } from "@/types/cms";
import type { FieldProps } from "../types";
import { Input } from "@/components/admin/ui/Input";
import { HighlightedText } from "@/components/ui/HighlightedText";
import { fieldDomId } from "../path";
import { FieldError } from "./shared";

export function HighlightTextField({ field, value, onChange, path, errors }: FieldProps) {
  if (field.kind !== "highlightText") return null;
  const current: HighlightText =
    value && typeof value === "object" ? (value as HighlightText) : { text: "", highlight: "" };
  const textId = fieldDomId(`${path}.text`);
  const highlightId = fieldDomId(`${path}.highlight`);
  const textError = errors[`${path}.text`];
  const highlightError = errors[`${path}.highlight`];
  const isValidHighlight = current.highlight === "" || current.text.includes(current.highlight);

  return (
    <div>
      <label htmlFor={textId} className="mb-1.5 block text-sm font-medium text-ink">
        {field.label}
      </label>
      {field.help && <p className="mb-1.5 text-xs text-grey-500">{field.help}</p>}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div>
          <label htmlFor={textId} className="mb-1 block text-xs font-medium text-grey-500">
            Text
          </label>
          <Input
            id={textId}
            value={current.text}
            onChange={(e) => onChange({ ...current, text: e.target.value })}
            invalid={Boolean(textError)}
          />
          <FieldError id={`${textId}-error`} message={textError} />
        </div>
        <div>
          <label htmlFor={highlightId} className="mb-1 block text-xs font-medium text-grey-500">
            Highlighted phrase
          </label>
          <Input
            id={highlightId}
            value={current.highlight}
            onChange={(e) => onChange({ ...current, highlight: e.target.value })}
            invalid={Boolean(highlightError) || !isValidHighlight}
          />
          <FieldError id={`${highlightId}-error`} message={highlightError} />
        </div>
      </div>

      <div className="mt-2 rounded-md bg-grey-50 px-3 py-2 text-sm text-ink">
        <span className="mr-2 text-xs uppercase tracking-wide text-grey-400">Preview</span>
        <HighlightedText value={current} />
      </div>
      {!isValidHighlight && (
        <p className="mt-1 text-xs text-amber-600">
          The highlighted phrase must be an exact substring of the text, or it will be ignored.
        </p>
      )}
    </div>
  );
}
