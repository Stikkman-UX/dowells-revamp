import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export function Input({ invalid, className = "", ...rest }: Props) {
  return (
    <input
      {...rest}
      aria-invalid={invalid || undefined}
      className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-ink placeholder:text-grey-400 focus:outline-none focus:ring-2 focus:ring-brand/40 ${
        invalid ? "border-red-400" : "border-grey-300"
      } ${className}`.trim()}
    />
  );
}
