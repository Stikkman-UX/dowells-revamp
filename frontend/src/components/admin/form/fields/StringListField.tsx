"use client";

import { Input } from "@/components/admin/ui/Input";
import { Button } from "@/components/admin/ui/Button";
import type { FieldProps } from "../types";
import { fieldDomId } from "../path";
import { FieldLabel, FieldError } from "./shared";

export function StringListField({ field, value, onChange, path, errors }: FieldProps) {
  if (field.kind !== "stringList") return null;
  const items = Array.isArray(value) ? (value as string[]) : [];
  const id = fieldDomId(path);
  const errorId = `${id}-error`;
  const error = errors[path];
  const atMax = field.max !== undefined && items.length >= field.max;

  function update(index: number, next: string) {
    const copy = items.slice();
    copy[index] = next;
    onChange(copy);
  }
  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }
  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const copy = items.slice();
    [copy[index], copy[target]] = [copy[target], copy[index]];
    onChange(copy);
  }

  return (
    <div>
      <FieldLabel htmlFor={id} label={field.label} help={field.help} />
      <div className="flex flex-col gap-2">
        {items.map((item, index) => {
          const itemError = errors[`${path}.${index}`];
          return (
            <div key={index} className="flex items-center gap-1.5">
              <Input
                id={index === 0 ? id : undefined}
                value={item}
                onChange={(e) => update(index, e.target.value)}
                invalid={Boolean(itemError)}
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label={`Move item ${index + 1} up`}
                className="rounded p-1.5 text-grey-500 hover:bg-grey-100 disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === items.length - 1}
                aria-label={`Move item ${index + 1} down`}
                className="rounded p-1.5 text-grey-500 hover:bg-grey-100 disabled:opacity-30"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => remove(index)}
                aria-label={`Remove item ${index + 1}`}
                className="rounded p-1.5 text-red-500 hover:bg-red-50"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="mt-2"
        onClick={() => onChange([...items, ""])}
        disabled={atMax}
      >
        Add item
      </Button>
      <FieldError id={errorId} message={error} />
    </div>
  );
}
