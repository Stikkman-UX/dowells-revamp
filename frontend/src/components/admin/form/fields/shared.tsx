import type { ReactNode } from "react";

export function FieldLabel({
  htmlFor,
  label,
  help,
}: {
  htmlFor: string;
  label: string;
  help?: string;
}) {
  return (
    <>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      {help && <p className="mb-1.5 text-xs text-grey-500">{help}</p>}
    </>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-xs text-red-600">
      {message}
    </p>
  );
}

export function FieldWrap({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}
