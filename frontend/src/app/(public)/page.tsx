import type { ComponentType } from "react";
import type { Metadata } from "next";
import { getPageContent, pageRegistry } from "@/content/registry";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getPageContent("home");

  // `title` is templated by the root layout ("%s | Dowell's"), so it must
  // NOT include the suffix itself. `ogTitle` is used as-is (untemplated).
  const title = seo?.title || "Home";
  const ogTitle = seo?.title ? `${seo.title} | Dowell's` : "Dowell's | Cable Accessories for Power, Industrial & Infrastructure";
  const description =
    seo?.description ||
    "A Polycab company. Cable accessories engineered for India's power, industrial and infrastructure sectors.";
  const canonical = seo?.canonical || "/";

  return {
    title,
    description,
    alternates: { canonical },
    robots: seo?.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: ogTitle,
      description,
      url: new URL(canonical, SITE_URL).toString(),
      images: seo?.ogImage ? [{ url: seo.ogImage.url }] : undefined,
    },
  };
}

export default async function HomePage() {
  const content = await getPageContent("home");
  const sectionEntries = pageRegistry.home.sections;

  return (
    <>
      {(Object.keys(sectionEntries) as (keyof typeof sectionEntries)[]).map((key) => {
        const data = content.sections[key];
        if (!data) return null;
        // Each registry entry's Component prop type is tied to its own
        // section data type; TS can't correlate that per-key inside a
        // generic loop, but the registry construction guarantees it lines
        // up (see src/content/registry.ts).
        const Component = sectionEntries[key].Component as ComponentType<{
          data: unknown;
        }>;
        return <Component key={key} data={data} />;
      })}
    </>
  );
}
