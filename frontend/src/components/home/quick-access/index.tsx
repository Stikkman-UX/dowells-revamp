import Link from "next/link";
import type { QuickAccessData, ResolvedMedia } from "@/types/cms";
import { Container } from "@/components/ui/Container";
import { CmsMedia } from "@/components/ui/CmsMedia";
import { CmsIcon } from "@/components/ui/CmsIcon";
import { SectionHeading } from "@/components/ui/SectionHeading";
import SearchForm from "./search-form";

type QuickAccessProps = { data: QuickAccessData };

/** Decorative corner arrow — structural chrome shared by every bento card, not a CMS field. */
const CORNER_ARROW: ResolvedMedia = {
  assetId: "",
  alt: "",
  url: "/home/quick-access/icon-corner-arrow.svg",
  mimeType: "image/svg+xml",
  fileType: "Image",
  fileSize: 0,
};

export default function QuickAccess({ data }: QuickAccessProps) {
  const { heading, description, searchCard, cards } = data;
  const [wideCard, ...smallCards] = cards;

  return (
    <section className="w-full bg-white py-20">
      <Container>
        <SectionHeading
          heading={heading}
          slot={<p className="lg:max-w-sm">{description}</p>}
        />

        <div className="mt-[3.125rem] grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-stretch">
          {/* Search card — UI only, never navigates or fetches */}
          <div className="relative flex min-h-[22rem] flex-col justify-between overflow-hidden rounded-lg bg-ink p-7 text-white lg:p-8">
            <CmsMedia
              media={searchCard.image}
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/20" />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-16 right-[-4rem] size-[30rem] rounded-full bg-[radial-gradient(circle,rgba(227,6,19,0.5)_0%,rgba(114,3,10,0.25)_30%,rgba(0,0,0,0)_60%)]"
            />

            <div className="relative z-10 flex items-start justify-between">
              <span className="flex size-12 items-center justify-center rounded-[0.875rem] bg-white/10">
                <CmsIcon media={searchCard.icon} size={20} />
              </span>
              {searchCard.href && (
                <Link
                  href={searchCard.href}
                  aria-label={searchCard.title || "Search"}
                  className="group rounded-full p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <CmsIcon
                    media={CORNER_ARROW}
                    size={20}
                    className="text-white/70 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </Link>
              )}
            </div>

            <div className="relative z-10 flex flex-col gap-8">
              <div className="flex flex-col gap-1">
                <h3 className="text-[2rem] font-semibold leading-tight text-white">
                  {searchCard.title}
                </h3>
                <p className="text-sm font-medium text-white/70">{searchCard.subtitle}</p>
              </div>
              <SearchForm placeholder={searchCard.placeholder} buttonLabel={searchCard.buttonLabel} />
            </div>
          </div>

          {/* Distributor / Download / Industries cards */}
          <div className="flex flex-col gap-5">
            {wideCard && (
              <a
                href={wideCard.href}
                className="group relative flex min-h-[15.125rem] flex-col justify-between overflow-hidden rounded-lg bg-[#fff5f5] p-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {wideCard.image && (
                  <CmsMedia
                    media={wideCard.image}
                    fill={false}
                    width={172}
                    height={182}
                    objectFit="contain"
                    sizes="180px"
                    className="pointer-events-none absolute right-6 top-1/2 hidden w-36 -translate-y-1/2 opacity-10 sm:block"
                  />
                )}
                <div className="relative z-10 flex items-start justify-between">
                  <span className="flex size-11 items-center justify-center rounded-[0.875rem] bg-white shadow-sm">
                    <CmsIcon media={wideCard.icon} size={20} />
                  </span>
                  <CmsIcon
                    media={CORNER_ARROW}
                    size={16}
                    className="text-ink/40 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </div>
                <div className="relative z-10 flex flex-col gap-1">
                  <h3 className="text-xl font-semibold text-ink">{wideCard.title}</h3>
                  <p className="text-sm font-medium text-grey-600">{wideCard.subtitle}</p>
                </div>
              </a>
            )}

            {smallCards.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {smallCards.map((card) => (
                  <a
                    key={card.title}
                    href={card.href}
                    className="group relative flex aspect-[296/242] flex-col justify-between overflow-hidden rounded-lg bg-ink p-6 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    {card.image && (
                      <>
                        <CmsMedia
                          media={card.image}
                          sizes="(min-width: 1024px) 25vw, 50vw"
                          className="-z-10 opacity-50"
                        />
                        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                      </>
                    )}
                    <div className="relative z-10 flex items-start justify-between">
                      <span className="flex size-11 items-center justify-center rounded-[0.875rem] bg-white/10">
                        <CmsIcon media={card.icon} size={20} />
                      </span>
                      <CmsIcon
                        media={CORNER_ARROW}
                        size={16}
                        className="text-white/70 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      />
                    </div>
                    <div className="relative z-10 flex flex-col gap-0.5">
                      <h3 className="text-base font-semibold">{card.title}</h3>
                      <p className="text-xs font-medium text-white/60">{card.subtitle}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
