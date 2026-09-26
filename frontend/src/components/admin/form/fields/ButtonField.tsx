"use client";

import type { Button as CmsButtonData } from "@/types/cms";
import type { Field, FieldProps } from "../types";
import { blankButton } from "../types";
import { Input } from "@/components/admin/ui/Input";
import { Switch } from "@/components/admin/ui/Switch";
import { CmsButton } from "@/components/ui/CmsButton";
import { MediaField } from "./MediaField";
import { fieldDomId } from "../path";
import { FieldError } from "./shared";

const ICON_FIELD: Field = { name: "icon", label: "Icon (SVG)", kind: "media", accept: "svg" };

/** THE reusable Button editor: text, href, withIcon, icon (SVG), iconPosition, openInNewTab. */
export function ButtonField({ field, value, onChange, path, errors }: FieldProps) {
  if (field.kind !== "button") return null;
  const button: CmsButtonData =
    value && typeof value === "object" ? (value as CmsButtonData) : blankButton();

  function set<K extends keyof CmsButtonData>(key: K, v: CmsButtonData[K]) {
    onChange({ ...button, [key]: v });
  }

  const textId = fieldDomId(`${path}.text`);
  const hrefId = fieldDomId(`${path}.href`);
  const positionId = fieldDomId(`${path}.iconPosition`);

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-ink">{field.label}</p>
      {field.help && <p className="mb-1.5 text-xs text-grey-500">{field.help}</p>}

      <div className="space-y-3 rounded-md border border-grey-200 p-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor={textId} className="mb-1 block text-xs font-medium text-grey-500">
              Text
            </label>
            <Input
              id={textId}
              value={button.text}
              maxLength={200}
              onChange={(e) => set("text", e.target.value)}
              invalid={Boolean(errors[`${path}.text`])}
            />
            <FieldError id={`${textId}-error`} message={errors[`${path}.text`]} />
          </div>
          <div>
            <label htmlFor={hrefId} className="mb-1 block text-xs font-medium text-grey-500">
              Link
            </label>
            <Input
              id={hrefId}
              value={button.href}
              onChange={(e) => set("href", e.target.value)}
              invalid={Boolean(errors[`${path}.href`])}
            />
            <FieldError id={`${hrefId}-error`} message={errors[`${path}.href`]} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Switch checked={button.withIcon} onChange={(v) => set("withIcon", v)} label="Show icon" />
          <Switch
            checked={button.openInNewTab}
            onChange={(v) => set("openInNewTab", v)}
            label="Open in new tab"
          />
        </div>

        {button.withIcon && (
          <>
            <MediaField
              field={ICON_FIELD}
              value={button.icon}
              onChange={(v) => set("icon", v as CmsButtonData["icon"])}
              path={`${path}.icon`}
              errors={errors}
            />
            <div>
              <label htmlFor={positionId} className="mb-1 block text-xs font-medium text-grey-500">
                Icon position
              </label>
              <select
                id={positionId}
                value={button.iconPosition}
                onChange={(e) => set("iconPosition", e.target.value as "left" | "right")}
                className="rounded-md border border-grey-300 bg-white px-3 py-2 text-sm text-ink"
              >
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </div>
          </>
        )}

        <div>
          <span className="mb-1 block text-xs font-medium text-grey-500">Preview</span>
          <div className="rounded-md bg-grey-50 p-4">
            <CmsButton button={button} variant="primary" />
          </div>
        </div>
      </div>
    </div>
  );
}
