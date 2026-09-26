import type { ProductCategoriesData } from "@/types/cms";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import CategoryTabs from "./category-tabs";

type ProductCategoriesProps = { data: ProductCategoriesData };

export default function ProductCategories({ data }: ProductCategoriesProps) {
  const { heading, categories } = data;

  if (categories.length === 0) return null;

  return (
    <section className="w-full bg-white py-20">
      <Container>
        <SectionHeading heading={heading} />
        <div className="mt-[3.125rem]">
          <CategoryTabs categories={categories} />
        </div>
      </Container>
    </section>
  );
}
