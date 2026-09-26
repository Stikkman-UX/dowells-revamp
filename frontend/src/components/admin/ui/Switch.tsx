type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  id?: string;
  disabled?: boolean;
};

/** Accessible toggle switch: a real checkbox visually hidden under a track. */
export function Switch({ checked, onChange, label, id, disabled }: Props) {
  return (
    <label
      htmlFor={id}
      className={`inline-flex items-center gap-2 ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
    >
      <span className="relative inline-flex h-5 w-9 shrink-0 items-center">
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className={`h-5 w-9 rounded-full transition-colors ${
            checked ? "bg-brand" : "bg-grey-300"
          } peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand`}
        />
        <span
          aria-hidden="true"
          className={`absolute left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </span>
      {label && <span className="text-sm text-ink">{label}</span>}
    </label>
  );
}
