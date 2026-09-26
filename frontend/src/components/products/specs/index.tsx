import type { PublicProduct } from "@/types/products";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CmsIcon } from "@/components/ui/CmsIcon";

type SpecsProps = { data: PublicProduct["specs"] };

/** Figma 313:1151. 1/2/4-column card grid; renders nothing when empty. */
export default function Specs({ data }: SpecsProps) {
  const { heading, items } = data;

  if (items.length === 0) return null;

  return (
    <section className="w-full bg-grey-50 py-16 lg:py-20">
      <Container className="flex flex-col gap-10">
        <SectionHeading heading={heading || "Built to perform."} />
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-grey-200 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, i) => (
            <div key={i} className="flex flex-col gap-6 bg-white p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-[0.625rem] bg-[#fff5f5]">
                <CmsIcon media={item.icon} size={16} className="text-brand" />
              </span>
              <dl className="flex flex-col gap-1">
                <dt className="text-[0.6875rem] font-medium uppercase tracking-[0.128rem] text-grey-500">
                  {item.label}
                </dt>
                <dd className="text-base font-semibold text-ink">{item.value}</dd>
              </dl>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
