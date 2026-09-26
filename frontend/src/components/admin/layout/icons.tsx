type IconProps = { className?: string };

const base = "shrink-0";

export function DashboardIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={`${base} ${className}`} aria-hidden="true">
      <rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <rect x="11" y="2.5" width="6.5" height="4.5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <rect x="11" y="9" width="6.5" height="8.5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <rect x="2.5" y="11" width="6.5" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function PagesIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={`${base} ${className}`} aria-hidden="true">
      <path
        d="M5 2.5h7l3 3v12a1 1 0 01-1 1H5a1 1 0 01-1-1v-14a1 1 0 011-1z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M7 9.5h6M7 12.5h6M7 6.5h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function CategoriesIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={`${base} ${className}`} aria-hidden="true">
      <path
        d="M10.5 2.5h4a1 1 0 011 1v4a1 1 0 01-.29.71l-7 7a1 1 0 01-1.42 0l-4.5-4.5a1 1 0 010-1.42l7-7a1 1 0 01.71-.29z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="13.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  );
}

export function ProductsIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={`${base} ${className}`} aria-hidden="true">
      <path
        d="M2.5 6.5L10 2.5l7.5 4v7L10 17.5l-7.5-4v-7z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M2.5 6.5L10 10.5l7.5-4M10 10.5v7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LogoutIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={`${base} ${className}`} aria-hidden="true">
      <path d="M8 2.5H4a1 1 0 00-1 1v13a1 1 0 001 1h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M12.5 6.5L17 10l-4.5 3.5M17 10H7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MenuIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={`${base} ${className}`} aria-hidden="true">
      <path d="M3 5.5h14M3 10h14M3 14.5h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function CloseIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={`${base} ${className}`} aria-hidden="true">
      <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
