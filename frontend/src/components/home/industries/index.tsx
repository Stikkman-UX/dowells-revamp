import type { IndustriesData } from "@/types/cms";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import IndustriesSlider from "./IndustriesSlider";

type IndustriesProps = { data: IndustriesData };

/**
 * Server entry point for the registry. The heading stays server-rendered
 * (SEO); the peeking scroll-snap slider is a client island. Figma:
 * GoalBased / Industries slider, node 313:484.
 */
export default function Industries({ data }: IndustriesProps) {
  const { heading, slides } = data;

  return (
    <section className="w-full overflow-x-hidden bg-grey-50 py-16 lg:py-20">
      <Container>
        <SectionHeading heading={heading} />
      </Container>

      {slides.length > 0 && (
        <div className="mt-10 lg:mt-14">
          <IndustriesSlider slides={slides} />
        </div>
      )}
    </section>
  );
}
