"use client";

import { useState, type FormEvent } from "react";
import { loginBrowser } from "@/lib/api/auth.client";
import { ApiError } from "@/lib/api/error";
import { Input } from "@/components/admin/ui/Input";
import { Button } from "@/components/admin/ui/Button";

export function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    try {
      await loginBrowser(email, password);
      // Full navigation, not router.replace + refresh: crossing the auth
      // boundary must drop the client Router Cache (which may hold the
      // logged-out redirect) and render the panel with the new cookies.
      // `next` is validated server-side as a same-origin /admin path.
      window.location.assign(next);
      return;
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 429) {
          setFormError("Too many attempts. Please wait a moment and try again.");
        } else if (err.status === 401) {
          setFormError(err.message || "Incorrect email or password.");
        } else if (err.status === 422 && err.errors) {
          const map: Record<string, string> = {};
          for (const e of err.errors) map[e.path] = e.message;
          setFieldErrors(map);
          setFormError("Please check the highlighted fields.");
        } else {
          setFormError(err.message || "Something went wrong. Please try again.");
        }
      } else {
        setFormError("Could not reach the server. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-lg border border-grey-200 bg-white p-6 shadow-sm"
    >
      {formError && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {formError}
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          disabled={submitting}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? "email-error" : undefined}
        />
        {fieldErrors.email && (
          <p id="email-error" className="mt-1 text-xs text-red-600">
            {fieldErrors.email}
          </p>
        )}
      </div>

      <div className="mb-5">
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={submitting}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          invalid={Boolean(fieldErrors.password)}
          aria-describedby={fieldErrors.password ? "password-error" : undefined}
        />
        {fieldErrors.password && (
          <p id="password-error" className="mt-1 text-xs text-red-600">
            {fieldErrors.password}
          </p>
        )}
      </div>

      <Button type="submit" variant="primary" className="w-full" loading={submitting}>
        {submitting ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
