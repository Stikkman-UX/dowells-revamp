import type { TextareaHTMLAttributes } from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

export function Textarea({ invalid, className = "", ...rest }: Props) {
  return (
    <textarea
      {...rest}
      aria-invalid={invalid || undefined}
      className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-ink placeholder:text-grey-400 focus:outline-none focus:ring-2 focus:ring-brand/40 ${
        invalid ? "border-red-400" : "border-grey-300"
      } ${className}`.trim()}
    />
  );
}
