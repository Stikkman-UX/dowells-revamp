import type { PublicProduct } from "@/types/products";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CmsMedia } from "@/components/ui/CmsMedia";

type DeployedProps = { data: PublicProduct["deployed"] };

/**
 * Figma 313:1191: one row at `lg` — item 0 spans 2 of N+1 columns, the rest
 * take 1 column each, and shows its description over a gradient; the rest
 * show only their title. `lg:grid-cols-[repeat(auto-fit,minmax(14rem,1fr))]`
 * lets the browser derive N+1 (or fewer, on a narrower `lg` viewport) itself:
 * auto-fit only ever creates as many tracks as the items (respecting item 0's
 * span) actually fill, and `minmax(14rem,…)` is the floor that keeps cards
 * from getting narrower than ~14rem — no per-render column math needed.
 * Below `lg`, 2 columns with item 0 spanning both; 1 column on mobile.
 * Renders nothing when there are no items.
 */
export default function Deployed({ data }: DeployedProps) {
  const { heading, items } = data;

  if (items.length === 0) return null;

  return (
    <section className="w-full bg-grey-50 py-16 lg:py-20">
      <Container className="flex flex-col gap-10">
        <SectionHeading
          heading={heading || "Where this product is deployed."}
          headingClassName="lg:max-w-none"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(14rem,1fr))]">
          {items.map((item, i) => (
            <div
              key={i}
              className={`relative h-80 overflow-hidden rounded-2xl bg-grey-100 ${
                i === 0 ? "sm:col-span-2 lg:col-span-2" : ""
              }`}
            >
              <CmsMedia
                media={item.image}
                alt={item.title}
                sizes={
                  i === 0
                    ? "(min-width: 1024px) 50vw, 100vw"
                    : "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                }
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 from-10% via-black/20 via-50% to-transparent"
              />
              <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-5">
                <h3 className="text-base font-semibold text-white">{item.title}</h3>
                {i === 0 && item.description && (
                  <p className="max-w-xs text-xs leading-relaxed text-white/80">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
