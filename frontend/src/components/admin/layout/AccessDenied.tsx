import Link from "next/link";
import type { User } from "@/types/cms";

export function AccessDenied({ user }: { user: User }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-lg font-semibold text-ink">Access denied</p>
      <p className="max-w-sm text-sm text-grey-500">
        {user.name} ({user.email}) is signed in as a {user.userType}, but the CMS admin area
        requires an Admin account.
      </p>
      <Link
        href="/admin/login"
        className="mt-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
      >
        Back to login
      </Link>
    </div>
  );
}
