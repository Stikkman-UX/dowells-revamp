import type { AboutData } from "@/types/cms";
import { Container } from "@/components/ui/Container";
import { CmsMedia } from "@/components/ui/CmsMedia";
import { CmsButton } from "@/components/ui/CmsButton";
import { HighlightedText } from "@/components/ui/HighlightedText";
import { Marquee } from "./Marquee";

type AboutProps = { data: AboutData };

const EYEBROW_CLASS =
  "text-[0.6875rem] font-normal uppercase tracking-[0.155em] text-[#737373]";

/** Matches Figma node 313:321. */
export default function About({ data }: AboutProps) {
  const {
    eyebrowLeft,
    partnerLogo,
    eyebrowRight,
    statement,
    button,
    image,
    clientsCaption,
    clients,
  } = data;

  return (
    <section className="w-full bg-white py-16 lg:py-20">
      <Container>
        <div className="flex flex-col items-center gap-7 pb-10 text-center lg:pb-10">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <span className={EYEBROW_CLASS}>{eyebrowLeft}</span>
            <span className="relative inline-flex h-9 w-[8.5rem] items-center justify-center overflow-hidden rounded-full bg-brand px-4">
              <span className="relative block h-[1.6875rem] w-[7.4375rem]">
                <CmsMedia
                  media={partnerLogo}
                  objectFit="contain"
                  alt={partnerLogo?.alt || "Partner"}
                />
              </span>
            </span>
            <span className={EYEBROW_CLASS}>{eyebrowRight}</span>
          </div>

          <HighlightedText
            as="p"
            value={statement}
            className="max-w-[41.5rem] text-balance text-[1.625rem] font-medium leading-[1.35] text-[rgba(48,48,48,0.69)]"
          />

          <CmsButton button={button} variant="accentLink" />
        </div>

        <div className="relative aspect-[1305/458] w-full overflow-hidden rounded-[1.125rem]">
          <CmsMedia media={image} alt={image?.alt} sizes="100vw" />
        </div>

        {clients.length > 0 && (
          <div className="mt-14 flex flex-col items-center gap-4">
            <p id="about-clients-caption" className={EYEBROW_CLASS}>
              {clientsCaption}
            </p>
            <div className="w-full">
              <Marquee clients={clients} labelledBy="about-clients-caption" />
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}
