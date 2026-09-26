import type { TrustData } from "@/types/cms";
import { CmsMedia } from "@/components/ui/CmsMedia";
import { CmsIcon } from "@/components/ui/CmsIcon";

type TrustProps = { data: TrustData };

/**
 * Static (no motion in the Figma prototype for this section) — pure
 * server component. Figma: TrustSection, node 438:432.
 *
 * Mobile stacks eyebrow/heading/description/certs, then a 2x2 stats grid,
 * then the image. From `lg` up the stats are pinned over the left edge of
 * the full-bleed side image instead, matching the design.
 */
export default function Trust({ data }: TrustProps) {
  const { eyebrow, heading, description, certifications, stats, image } = data;

  return (
    <section className="relative w-full overflow-hidden bg-surface-dark">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 top-1/4 hidden h-[31.25rem] w-[31.25rem] rounded-full bg-[radial-gradient(circle,rgba(227,6,19,0.18),transparent_60%)] lg:block"
      />

      <div className="relative flex flex-col lg:flex-row lg:items-stretch">
        <div className="flex flex-col gap-6 px-4 py-16 lg:w-1/2 lg:px-20 lg:py-24">
          {eyebrow && (
            <span className="text-[0.6875rem] font-medium uppercase tracking-[0.1553rem] text-white/60">
              {eyebrow}
            </span>
          )}
          <h2 className="text-[2rem] font-semibold leading-tight tracking-[-0.053rem] text-white lg:text-[2.625rem] lg:leading-[3.3rem]">
            {heading}
          </h2>
          {description && (
            <p className="max-w-[28rem] text-base leading-relaxed text-white/70">
              {description}
            </p>
          )}

          {certifications.length > 0 && (
            <ul className="mt-4 flex flex-wrap items-center gap-3">
              {certifications.map((cert) => (
                <li key={cert.label}>
                  <span className="inline-flex items-center gap-2 rounded-pill bg-white/5 px-4 py-2.5 text-sm text-white">
                    <CmsIcon media={cert.icon} size={16} className="text-brand" />
                    {cert.label}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="relative flex flex-col gap-6 px-4 pb-16 lg:block lg:w-[44.5rem] lg:px-0 lg:pb-0">
          {stats.length > 0 && (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-6 lg:absolute lg:inset-y-0 lg:left-0 lg:z-10 lg:flex lg:w-[11.25rem] lg:grid-cols-none lg:flex-col lg:justify-between lg:gap-0 lg:p-9">
              {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col gap-1">
                  <dd className="text-[2rem] font-semibold tracking-[-0.0393rem] text-white">
                    {stat.value}
                  </dd>
                  <dt className="text-[0.6875rem] font-medium uppercase tracking-[0.1278rem] text-white/90">
                    {stat.label}
                  </dt>
                </div>
              ))}
            </dl>
          )}

          <div className="relative h-[18rem] w-full overflow-hidden rounded-md sm:h-[24rem] lg:absolute lg:inset-0 lg:h-full lg:rounded-none">
            <CmsMedia
              media={image}
              sizes="(min-width: 1024px) 44.5rem, 100vw"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent from-[37%] to-black/80" />
            <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-1/3 bg-gradient-to-r from-surface-dark to-transparent lg:block" />
          </div>
        </div>
      </div>
    </section>
  );
}
