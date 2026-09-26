import type { Field } from "./types";
import type { Media } from "@/types/cms";

/**
 * Converts the resolved form the admin edits (ResolvedMedia objects) back
 * into the stored form the API expects (`{ assetId, alt }` only), per
 * API_CONTRACT.md §4.1 "Send media as `{assetId, alt}` only". Walks the
 * same `formConfig` used to render the fields so nested media inside
 * `button`, `group` and `repeater` fields is converted too.
 */
export function toStoredForm(fields: Field[], data: unknown): unknown {
  if (!data || typeof data !== "object") return data;
  const obj = data as Record<string, unknown>;
  const result: Record<string, unknown> = { ...obj };
  for (const field of fields) {
    result[field.name] = fieldToStored(field, obj[field.name]);
  }
  return result;
}

function mediaToStored(value: unknown): Media {
  if (!value || typeof value !== "object") return null;
  const v = value as { assetId?: unknown; alt?: unknown };
  if (typeof v.assetId !== "string" || !v.assetId) return null;
  return { assetId: v.assetId, alt: typeof v.alt === "string" ? v.alt : "" };
}

function buttonToStored(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  const v = value as Record<string, unknown>;
  return { ...v, icon: mediaToStored(v.icon) };
}

function fieldToStored(field: Field, value: unknown): unknown {
  switch (field.kind) {
    case "media":
      return mediaToStored(value);
    case "button":
      return buttonToStored(value);
    case "group":
      return toStoredForm(field.fields, value);
    case "repeater": {
      const arr = Array.isArray(value) ? value : [];
      return arr.map((item) => toStoredForm(field.fields, item));
    }
    default:
      return value;
  }
}
