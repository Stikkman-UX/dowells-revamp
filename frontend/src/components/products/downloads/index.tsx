import type { PublicProduct } from "@/types/products";
import type { CatalogueData } from "@/types/cms";
import { Container } from "@/components/ui/Container";
import CatalogueCard from "@/components/global/catalogue";
import { formatFileSize, fileTypeLabel } from "@/lib/format";
import FloatingPills from "./FloatingPills";

type DownloadsProps = {
  product: PublicProduct;
  catalogue: CatalogueData | null;
};

/**
 * Figma 313:1081. Header row: heading on the left (sized to fit on one line
 * at ≥ lg, per the node's 42px/2.625rem type — SectionHeading's shared
 * `lg:max-w-[32rem]` measure is deliberately not reused here, since it's
 * tuned for a balanced two-line wrap that this heading isn't meant to have)
 * with FloatingPills inline on the right. Below it: the site-wide catalogue
 * card (skipped when the `_global.catalogue` section is hidden/unsaved —
 * Root Rule 5) and this product's own download rows, skipping any row whose
 * `file` never got uploaded. `id="downloads"` is the FloatingPills anchor
 * target.
 */
export default function Downloads({ product, catalogue }: DownloadsProps) {
  const { heading, items } = product.downloads;
  const rows = items.filter(
    (item): item is { title: string; file: NonNullable<typeof item.file> } => item.file !== null
  );

  if (!catalogue && rows.length === 0) {
    return null;
  }

  return (
    <section id="downloads" className="w-full bg-grey-50 py-16 lg:py-20">
      <Container className="flex flex-col gap-8">
        <div className="flex items-center justify-between gap-6">
          <h2 className="text-balance text-[2rem] font-semibold leading-tight tracking-tight text-ink lg:whitespace-nowrap lg:text-[2.625rem]">
            {heading || "Everything your engineers need."}
          </h2>
          <FloatingPills />
        </div>

        <div className={`grid gap-6 ${catalogue && rows.length > 0 ? "lg:grid-cols-2 lg:items-stretch" : ""}`}>
          {catalogue && <CatalogueCard data={catalogue} />}

          {rows.length > 0 && (
            <ul className="flex flex-col gap-3">
              {rows.map((item, i) => (
                <li key={i}>
                  <a
                    href={item.file.url}
                    download
                    className="flex items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm transition-colors hover:bg-white/70"
                  >
                    <span className="flex min-w-0 items-center gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.875rem] bg-[#fff5f5]">
                        {/* eslint-disable-next-line @next/next/no-img-element -- static Figma SVG, not CMS content. */}
                        <img src="/products/file.svg" alt="" className="h-4 w-4" />
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-base font-semibold text-ink">
                          {item.title}
                        </span>
                        <span className="text-xs text-grey-500">
                          {formatFileSize(item.file.fileSize)} · {fileTypeLabel(item.file.mimeType)}
                        </span>
                      </span>
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element -- static Figma SVG, not CMS content. */}
                    <img src="/products/chevron.svg" alt="" className="h-4 w-4 shrink-0" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
    </section>
  );
}
