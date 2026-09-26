"use client";

import { getFormConfig } from "@/content/formRegistry";
import { SectionForm } from "@/components/admin/form/SectionForm";
import { SeoForm } from "@/components/admin/form/SeoForm";
import type { ResolvedSeo, PageKind } from "@/types/cms";

export type SectionPanelDescriptor = {
  key: string;
  label: string;
  initial: { isVisible: boolean; data: unknown; rev: number };
};

type Props = {
  slug: string;
  title: string;
  path: string;
  kind: PageKind;
  panels: SectionPanelDescriptor[];
  seo: ResolvedSeo | null;
};

export function PageEditor({ slug, title, path, kind, panels, seo }: Props) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-ink">{title}</h1>
        {path && <p className="text-sm text-grey-500">{path}</p>}
      </div>

      {panels.map((panel) => (
        <SectionForm
          key={panel.key}
          slug={slug}
          sectionKey={panel.key}
          label={panel.label}
          // Form configs hold functions (newItem), so they cannot be passed from the
          // server page as props — resolve them here, on the client.
          formConfig={getFormConfig(slug, panel.key)}
          initial={panel.initial}
        />
      ))}

      {kind === "page" && seo && <SeoForm slug={slug} initial={seo} />}
    </div>
  );
}
