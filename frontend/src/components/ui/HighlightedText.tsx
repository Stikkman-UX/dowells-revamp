import type { ComponentPropsWithoutRef, ElementType } from "react";
import type { HighlightText } from "@/types/cms";

type HighlightedTextOwnProps<T extends ElementType> = {
  value: HighlightText;
  as?: T;
  className?: string;
};

type HighlightedTextProps<T extends ElementType> = HighlightedTextOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof HighlightedTextOwnProps<T> | "children">;

/**
 * Wraps the FIRST occurrence of `value.highlight` inside `value.text` in
 * `<span className="text-brand">`. Renders plain text when `highlight` is
 * empty or not actually a substring of `text` (the backend validates this,
 * but the frontend stays defensive).
 */
export function HighlightedText<T extends ElementType = "span">({
  value,
  as,
  className = "",
  ...rest
}: HighlightedTextProps<T>) {
  const Tag = (as ?? "span") as ElementType;
  const { text, highlight } = value;

  const index = highlight ? text.indexOf(highlight) : -1;

  if (index === -1) {
    return (
      <Tag className={className} {...rest}>
        {text}
      </Tag>
    );
  }

  const before = text.slice(0, index);
  const after = text.slice(index + highlight.length);

  return (
    <Tag className={className} {...rest}>
      {before}
      <span className="text-brand">{highlight}</span>
      {after}
    </Tag>
  );
}
