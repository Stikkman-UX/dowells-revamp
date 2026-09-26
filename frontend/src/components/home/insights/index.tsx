import type { InsightsData } from "@/types/cms";
import { Container } from "@/components/ui/Container";
import InsightsBody from "./insights-body";

type InsightsProps = { data: InsightsData };

export default function Insights({ data }: InsightsProps) {
  const { heading, allLabel, filterTags, articles } = data;

  if (articles.length === 0) return null;

  return (
    <section className="w-full bg-white py-20">
      <Container>
        <InsightsBody
          heading={heading}
          allLabel={allLabel}
          filterTags={filterTags}
          articles={articles}
        />
      </Container>
    </section>
  );
}
