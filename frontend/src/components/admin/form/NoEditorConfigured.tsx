export function NoEditorConfigured({ data }: { data: unknown }) {
  return (
    <div>
      <p className="rounded-md border border-dashed border-grey-300 bg-grey-50 px-3 py-2 text-sm text-grey-600">
        No editor configured for this section yet. Showing the raw saved data below (read-only).
      </p>
      <pre className="mt-3 max-h-96 overflow-auto rounded-md bg-ink px-3 py-2 text-xs text-grey-100">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
