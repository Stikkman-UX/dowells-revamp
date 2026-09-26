"use client";

import type { FieldProps } from "../types";
import { Switch } from "@/components/admin/ui/Switch";
import { fieldDomId } from "../path";

export function BooleanField({ field, value, onChange, path }: FieldProps) {
  if (field.kind !== "boolean") return null;
  const id = fieldDomId(path);

  return (
    <div>
      <Switch id={id} checked={Boolean(value)} onChange={onChange} label={field.label} />
      {field.help && <p className="mt-1 text-xs text-grey-500">{field.help}</p>}
    </div>
  );
}
