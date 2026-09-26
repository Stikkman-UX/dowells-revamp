import type { ReactNode } from "react";
import TopBar from "@/components/global/top-bar";
import Header from "@/components/global/header";
import Footer from "@/components/global/footer";
import { getPageContent } from "@/content/registry";
import { getPublicCategories } from "@/lib/api/products";

// Caching is deliberately OFF pre-launch so admin edits show up
// immediately. See frontend/CLAUDE.md "Caching (disabled pre-launch)".
export const dynamic = "force-dynamic";

export default async function PublicLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [global, categories] = await Promise.all([
    getPageContent("_global"),
    getPublicCategories(),
  ]);

  return (
    <>
      <TopBar />
      {global.sections.header && (
        <Header data={global.sections.header} productsMenu={categories} />
      )}
      <main className="w-full overflow-x-hidden">{children}</main>
      {global.sections.footer && <Footer data={global.sections.footer} />}
    </>
  );
}
