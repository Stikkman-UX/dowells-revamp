"use client";

import type { Button as CmsButtonData } from "@/types/cms";
import { CmsButton } from "@/components/ui/CmsButton";

type NewsletterFormProps = {
  placeholder: string;
  button: CmsButtonData;
};

/**
 * UI-only newsletter subscribe form (API_CONTRACT.md §4.4: "UI only, no
 * submit behaviour yet"). Intercepts submit so it never navigates or hits
 * the network. Client island — everything else in the footer is static.
 */
export default function NewsletterForm({ placeholder, button }: NewsletterFormProps) {
  return (
    <form
      className="flex w-full max-w-md items-center gap-2 rounded-full bg-white/5 p-1.5"
      onSubmit={(event) => event.preventDefault()}
    >
      <label htmlFor="footer-newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="footer-newsletter-email"
        name="email"
        type="email"
        placeholder={placeholder}
        autoComplete="email"
        className="min-w-0 flex-1 bg-transparent px-4 text-sm text-white placeholder:text-white/40 focus-visible:outline-none"
      />
      <CmsButton button={button} variant="primary" size="sm" />
    </form>
  );
}
