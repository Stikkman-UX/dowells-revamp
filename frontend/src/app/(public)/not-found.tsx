import Link from "next/link";
import { Container } from "@/components/ui/Container";

export default function PublicNotFound() {
  return (
    <Container className="flex min-h-[50vh] flex-col items-center justify-center gap-4 py-20 text-center">
      <h1 className="text-2xl font-semibold text-ink">Page not found</h1>
      <p className="max-w-md text-sm text-grey-600">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Link
        href="/"
        className="rounded-full bg-brand px-6 py-3 text-sm font-medium text-white hover:bg-brand-dark"
      >
        Back to home
      </Link>
    </Container>
  );
}
