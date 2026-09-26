import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Log in" };

/** Same-origin path guard: only ever redirect back into /admin/*. */
function sanitizeNext(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return "/admin";
  if (!value.startsWith("/admin")) return "/admin";
  if (value.startsWith("//") || value.includes("://")) return "/admin";
  return value;
}

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  const params = await searchParams;
  const next = sanitizeNext(params.next);

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-lg font-semibold text-ink">Dowell&apos;s CMS</p>
          <p className="mt-1 text-sm text-grey-500">Sign in to manage site content</p>
        </div>
        <LoginForm next={next} />
      </div>
    </div>
  );
}
