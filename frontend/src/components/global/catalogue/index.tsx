import type { CatalogueData } from "@/types/cms";
import { CmsButton } from "@/components/ui/CmsButton";

type CatalogueCardProps = { data: CatalogueData };

/**
 * The site-wide catalogue PDF card (Figma 313:1081, red card). Presentational
 * and self-contained: it is composed into the product Downloads section by a
 * parent that already provides the `Container`, so this renders only the
 * card itself. Tall vertical layout per the node (icon → title → caption →
 * button, `justify-between` so it fills whatever height the sibling download
 * list stretches it to via `lg:items-stretch`). The button's `href` is always
 * replaced with the uploaded file's URL — the stored `button.href` is ignored
 * per API_CONTRACT §4.4 — so with no file uploaded yet it renders as an inert
 * label (CmsButton renders a `<span>` when `href` is empty). The file icon is
 * the same glyph as the download rows' (`file.svg`, Figma reuses one icon
 * component in both places) rendered white for the red background.
 */
export default function CatalogueCard({ data }: CatalogueCardProps) {
  const { title, caption, file, button } = data;

  return (
    <div className="flex h-full flex-col justify-between gap-6 rounded-2xl bg-brand px-7 py-7 text-white">
      <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- static Figma SVG, not CMS content. */}
        <img src="/products/file-download-white.svg" alt="" className="h-full w-full" />
      </span>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-2xl font-semibold leading-tight">{title}</h3>
        {caption && <p className="text-sm text-white/85">{caption}</p>}
      </div>
      <CmsButton
        button={{ ...button, href: file?.url ?? "", openInNewTab: true }}
        variant="secondary"
        size="md"
        className="w-fit shrink-0"
      />
    </div>
  );
}
