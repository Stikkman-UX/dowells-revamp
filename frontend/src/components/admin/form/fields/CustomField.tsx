import type { FieldProps } from "../types";

/** Passthrough for `{ kind: "custom" }` fields — the field owns its own chrome. */
export function CustomField(props: FieldProps) {
  if (props.field.kind !== "custom") return null;
  const Component = props.field.component;
  return <Component {...props} />;
}
