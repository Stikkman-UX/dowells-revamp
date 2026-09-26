import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAdminPage, listAdminPages } from "@/lib/api/pages";
import { pageRegistry } from "@/content/registry";
import { PageEditor, type SectionPanelDescriptor } from "@/components/admin/pages/PageEditor";
import type { PageKind } from "@/types/cms";

type LooseSectionEntry = { label: string };
type LoosePageEntry = {
  title: string;
  kind: PageKind;
  path: string;
  sections: Record<string, LooseSectionEntry>;
};

/**
 * `pageRegistry`'s section-value types differ per entry (GlobalSections vs
 * HomeSections, and future pages), so there's no single mapped type that
 * fits a page-generic lookup by a runtime `slug` string. The admin editor
 * only needs `label` per section here (form configs are resolved client-side
 * via `formRegistry`, since they contain functions), never the render Component,
 * so this loose view is sufficient and keeps registry.ts untouched.
 */
function getRegistryEntry(slug: string): LoosePageEntry | undefined {
  return (pageRegistry as unknown as Record<string, LoosePageEntry>)[slug];
}

type AdminSectionLoose = { isVisible: boolean; data: unknown; rev: number; updatedAt: string };

export async function generateMetadata({
  params,
}: PageProps<"/admin/pages/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const entry = getRegistryEntry(slug);
  return { title: entry?.title ?? slug };
}

export default async function PageEditorRoute({ params }: PageProps<"/admin/pages/[slug]">) {
  const { slug } = await params;

  const registryEntry = getRegistryEntry(slug);
  const { pages } = await listAdminPages();
  const listItem = pages.find((p) => p.slug === slug);

  if (!registryEntry && !listItem) {
    notFound();
  }

  const page = await getAdminPage<Record<string, AdminSectionLoose>>(slug);

  const apiKeys = Object.keys(page.sections);
  const registryKeys = registryEntry ? Object.keys(registryEntry.sections) : [];
  // Section order: the frontend registry's order when available, then any
  // extra keys the API knows about that the registry doesn't (yet) — those
  // fall back to "No editor configured" rather than being dropped.
  const orderedKeys = [
    ...registryKeys.filter((k) => apiKeys.includes(k)),
    ...apiKeys.filter((k) => !registryKeys.includes(k)),
  ];

  const panels: SectionPanelDescriptor[] = orderedKeys.map((key) => {
    const section = page.sections[key];
    const registrySection = registryEntry?.sections[key];
    return {
      key,
      label: registrySection?.label ?? key,
      initial: { isVisible: section.isVisible, data: section.data, rev: section.rev },
    };
  });

  const kind: PageKind = listItem?.kind ?? registryEntry?.kind ?? "page";
  const title = listItem?.title ?? registryEntry?.title ?? slug;
  const path = listItem?.path ?? registryEntry?.path ?? "";

  return (
    <PageEditor
      slug={slug}
      title={title}
      path={path}
      kind={kind}
      panels={panels}
      seo={kind === "page" ? page.seo : null}
    />
  );
}
