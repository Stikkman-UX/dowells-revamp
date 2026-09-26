"use client";

import type { FormEvent } from "react";

type SearchFormProps = {
  placeholder: string;
  buttonLabel: string;
};

/**
 * UI-only search box for the Quick Access hero card. A real
 * `<form role="search">` with a labelled input, but the submit is
 * intentionally prevented — there is no search backend wired up yet, so
 * this never navigates or fetches (per the CMS contract, `searchCard` is
 * presentational chrome only).
 */
export default function SearchForm({ placeholder, buttonLabel }: SearchFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className="flex h-11 w-full items-center gap-2 rounded-[0.875rem] bg-white/10 py-1 pl-4 pr-1.5"
    >
      <span aria-hidden="true" className="block size-4 shrink-0 bg-white/50 [mask-image:url('/home/quick-access/icon-search.svg')] [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain]" />
      <label htmlFor="quick-access-search" className="sr-only">
        {placeholder}
      </label>
      <input
        id="quick-access-search"
        type="search"
        name="q"
        placeholder={placeholder}
        className="h-full min-w-0 flex-1 bg-transparent text-sm text-white placeholder-white/50 outline-none"
      />
      <button
        type="submit"
        className="inline-flex h-7 shrink-0 items-center rounded-[0.625rem] bg-white px-3 text-xs font-medium text-ink transition-colors hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        {buttonLabel}
      </button>
    </form>
  );
}
