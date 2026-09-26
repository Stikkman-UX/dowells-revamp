import type { ImpactData } from "@/types/cms";
import { Container } from "@/components/ui/Container";
import { CmsMedia } from "@/components/ui/CmsMedia";
import { CmsButton } from "@/components/ui/CmsButton";
import { SectionHeading } from "@/components/ui/SectionHeading";

type ImpactProps = { data: ImpactData };

export default function Impact({ data }: ImpactProps) {
  const { heading, button, cards } = data;

  if (cards.length === 0) return null;

  const [first, ...rest] = cards;
  const smallCards = rest.slice(0, 2);

  return (
    <section className="w-full bg-white py-20">
      <Container>
        <SectionHeading
          heading={heading}
          slot={<CmsButton button={button} variant="accentLink" />}
        />

        <div className="mt-[3.125rem] grid grid-cols-1 gap-5 lg:grid-cols-[743fr_502fr] lg:items-stretch">
          {first && (
            <a
              href={first.href}
              className="group relative flex aspect-[743/560] flex-col justify-end overflow-hidden rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand lg:aspect-auto"
            >
              <div className="absolute inset-0 overflow-hidden">
                <CmsMedia
                  media={first.image}
                  sizes="(min-width: 1024px) 58vw, 100vw"
                  className="transition-transform duration-500 ease-out group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="relative z-10 flex flex-col items-start gap-3 p-9">
                {first.tag && (
                  <span className="rounded-full bg-brand px-3 py-1 text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-white">
                    {first.tag}
                  </span>
                )}
                <h3 className="max-w-lg text-2xl font-semibold leading-tight text-white sm:text-[2rem]">
                  {first.title}
                </h3>
                {first.meta && <p className="text-sm text-white/70">{first.meta}</p>}
              </div>
            </a>
          )}

          {smallCards.length > 0 && (
            <div className="flex flex-col gap-5">
              {smallCards.map((card) => (
                <a
                  key={card.title}
                  href={card.href}
                  className="group relative flex aspect-[502/345] flex-col justify-end overflow-hidden rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  <div className="absolute inset-0 overflow-hidden">
                    <CmsMedia
                      media={card.image}
                      sizes="(min-width: 1024px) 27vw, 100vw"
                      className="transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="relative z-10 flex flex-col items-start gap-2.5 p-6">
                    {card.tag && (
                      <span className="rounded-full bg-white/20 px-3 py-1 text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-white">
                        {card.tag}
                      </span>
                    )}
                    <h3 className="text-lg font-semibold leading-snug text-white">{card.title}</h3>
                    {card.meta && <p className="text-sm text-white/70">{card.meta}</p>}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
