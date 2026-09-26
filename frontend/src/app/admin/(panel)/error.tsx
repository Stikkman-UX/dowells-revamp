"use client";

import { useEffect } from "react";
import { Button } from "@/components/admin/ui/Button";

export default function PanelError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <p className="text-lg font-semibold text-ink">Something went wrong</p>
      <p className="max-w-sm text-sm text-grey-500">
        {error.message || "An unexpected error occurred while loading this page."}
      </p>
      <Button variant="primary" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
