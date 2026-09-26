import Link from "next/link";

export default function PanelNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <p className="text-lg font-semibold text-ink">Not found</p>
      <p className="max-w-sm text-sm text-grey-500">
        The page you&apos;re looking for doesn&apos;t exist or isn&apos;t registered in the CMS.
      </p>
      <Link
        href="/admin/pages"
        className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
      >
        Back to Pages
      </Link>
    </div>
  );
}
