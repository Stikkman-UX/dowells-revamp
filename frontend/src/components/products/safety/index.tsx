import type { PublicProduct } from "@/types/products";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CmsMedia } from "@/components/ui/CmsMedia";
import { CmsIcon } from "@/components/ui/CmsIcon";

type SafetyProps = { data: PublicProduct["safety"] };

/**
 * Figma 313:1220. Red check-bullets (the check glyph is a static Figma
 * asset, public/products/check.svg — not CMS content) + product image on
 * the left, a CERTIFICATIONS card list on the right. Renders nothing when
 * every field is empty.
 */
export default function Safety({ data }: SafetyProps) {
  const { heading, bullets, image, certifications } = data;

  if (bullets.length === 0 && !image && certifications.length === 0) {
    return null;
  }

  return (
    <section className="w-full bg-white py-16 lg:py-20">
      <Container className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-16">
        <div className="flex flex-1 flex-col gap-10 lg:flex-row lg:items-center">
          <div className="flex flex-1 flex-col gap-8">
            <SectionHeading heading={heading || "Engineered for safety and longevity."} />
            {bullets.length > 0 && (
              <ul className="flex flex-col gap-4">
                {bullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand">
                      {/* eslint-disable-next-line @next/next/no-img-element -- static Figma SVG, not CMS content. */}
                      <img src="/products/check.svg" alt="" className="h-3 w-3" />
                    </span>
                    <span className="text-base text-grey-700">{bullet}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {image && (
            <div className="relative h-52 w-full shrink-0 overflow-hidden lg:h-64 lg:w-72">
              <CmsMedia media={image} alt="" objectFit="contain" />
            </div>
          )}
        </div>

        {certifications.length > 0 && (
          <div className="flex w-full shrink-0 flex-col gap-4 rounded-2xl bg-grey-50 p-6 lg:w-80">
            <span className="text-xs font-medium uppercase tracking-[0.15rem] text-grey-500">
              Certifications
            </span>
            <ul className="flex flex-col gap-3">
              {certifications.map((cert, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#fff5f5]">
                    <CmsIcon media={cert.icon} size={18} className="text-brand" />
                  </span>
                  <span className="text-base font-semibold text-ink">{cert.label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Container>
    </section>
  );
}
