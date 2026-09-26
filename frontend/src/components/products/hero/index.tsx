import type { PublicProduct } from "@/types/products";
import { Container } from "@/components/ui/Container";
import { CmsMedia } from "@/components/ui/CmsMedia";
import { CmsIcon } from "@/components/ui/CmsIcon";
import { CmsButton } from "@/components/ui/CmsButton";

type HeroProps = { product: PublicProduct };

/**
 * Product hero (Figma 313:900 + CTA row 313:947). Two columns from `lg`,
 * stacked below. The image is the LCP element (`preload`), the product name
 * is the page's single `<h1>`.
 */
export default function Hero({ product }: HeroProps) {
  const { category, name, hero } = product;
  const { image, description, keySpecs, idealFor, primaryButton, secondaryButton } = hero;

  return (
    <section className="w-full bg-white py-10 lg:py-16">
      <Container className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-16">
        <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-sm bg-grey-50 lg:aspect-auto lg:h-[36.5rem] lg:w-[36.375rem]">
          <CmsMedia
            media={image}
            alt={name}
            objectFit="contain"
            preload
            sizes="(min-width: 1024px) 36.375rem, 100vw"
            className="p-8"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <div className="flex flex-col gap-3">
            <span className="w-fit text-xs font-medium uppercase tracking-wide text-grey-500">
              {category.name}
            </span>
            <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-ink lg:text-[2.625rem]">
              {name}
            </h1>
          </div>

          {description && (
            <p className="max-w-[37.4375rem] text-base leading-relaxed text-grey-600">
              {description}
            </p>
          )}

          {keySpecs.length > 0 && (
            <div className="grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2">
              {keySpecs.map((spec, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CmsIcon media={spec.icon} size={28} className="shrink-0 text-brand" />
                  <dl className="flex flex-col text-sm leading-tight">
                    <dt className="text-grey-500">{spec.label}</dt>
                    <dd className="font-semibold text-brand">{spec.value}</dd>
                  </dl>
                </div>
              ))}
            </div>
          )}

          {idealFor.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className="h-4 w-0.5 bg-grey-400" />
                <span className="text-sm font-semibold uppercase tracking-wide text-grey-600">
                  Ideal For
                </span>
              </div>
              <ul className="flex flex-wrap items-center gap-3">
                {idealFor.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-sm bg-grey-50 px-4 py-2 text-sm text-grey-600"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <CmsButton button={primaryButton} variant="primary" size="md" />
            <CmsButton button={secondaryButton} variant="secondary" size="md" />
          </div>
        </div>
      </Container>
    </section>
  );
}
