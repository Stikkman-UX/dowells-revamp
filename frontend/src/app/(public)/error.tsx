"use client";

import { useEffect } from "react";
import { Container } from "@/components/ui/Container";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="flex min-h-[50vh] flex-col items-center justify-center gap-4 py-20 text-center">
      <h1 className="text-2xl font-semibold text-ink">Something went wrong</h1>
      <p className="max-w-md text-sm text-grey-600">
        We couldn&apos;t load this page. Please try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-brand px-6 py-3 text-sm font-medium text-white hover:bg-brand-dark"
      >
        Try again
      </button>
    </Container>
  );
}
