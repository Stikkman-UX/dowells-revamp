export function ApiUnavailable() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-lg font-semibold text-ink">CMS API unavailable</p>
      <p className="max-w-sm text-sm text-grey-500">
        We couldn&apos;t reach the backend service. Check that it is running and reload this page.
      </p>
    </div>
  );
}
