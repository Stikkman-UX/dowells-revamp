import type { ComponentType } from "react";
import type { Button, CtaButton, HighlightText } from "@/types/cms";
import type { MediaAccept } from "./fields/mediaAccept";

type Base = { name: string; label: string; help?: string };

export type Field = Base &
  (
    | { kind: "text" | "textarea" | "url"; maxLength?: number }
    | { kind: "highlightText" }
    | { kind: "boolean" }
    | { kind: "button" }
    | { kind: "select"; options: { value: string; label: string }[] }
    | { kind: "stringList"; max?: number }
    | { kind: "media"; accept: MediaAccept }
    | { kind: "group"; fields: Field[] }
    | {
        kind: "repeater";
        fields: Field[];
        min?: number;
        max?: number;
        /** Name of the child field used as the row title. */
        itemLabel: string;
        newItem: () => unknown;
      }
    | { kind: "custom"; component: ComponentType<FieldProps> }
  );

export type FieldProps = {
  field: Field;
  value: unknown;
  onChange: (v: unknown) => void;
  path: string;
  errors: Record<string, string>;
};

// --- Blank-value factories for repeater `newItem` / initial form state ----

export function blankButton(): Button {
  return {
    text: "",
    href: "",
    withIcon: false,
    icon: null,
    iconPosition: "left",
    openInNewTab: false,
  };
}

export function blankCtaButton(): CtaButton {
  return { ...blankButton(), variant: "red" };
}

/** Leaf fields for a raw `Button` sitting directly inside a repeater item
 * (no wrapping key) — the composite `button` field kind only applies to a
 * Button stored at a named property. */
export const buttonLeafFields: Field[] = [
  { kind: "text", name: "text", label: "Text", maxLength: 200 },
  { kind: "url", name: "href", label: "Link" },
  { kind: "boolean", name: "withIcon", label: "Show icon" },
  {
    kind: "media",
    name: "icon",
    label: "Icon",
    accept: "svg",
    help: 'Ignored when "Show icon" is off.',
  },
  {
    kind: "select",
    name: "iconPosition",
    label: "Icon position",
    options: [
      { value: "left", label: "Left" },
      { value: "right", label: "Right" },
    ],
  },
  { kind: "boolean", name: "openInNewTab", label: "Open in new tab" },
];

export function blankHighlight(): HighlightText {
  return { text: "", highlight: "" };
}

// Typed as the literal `null` so it is assignable to both the stored `Media`
// and the resolved `ResolvedMedia` shapes used by section `newItem()` factories.
export const blankMedia = null;
