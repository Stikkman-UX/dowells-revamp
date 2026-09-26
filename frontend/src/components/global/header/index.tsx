import type { HeaderData } from "@/types/cms";
import type { PublicCategory } from "@/types/products";
import HeaderBar from "./HeaderBar";

type HeaderProps = {
  data: HeaderData;
  /**
   * Null/empty degrades the "Products" nav item to a plain link. Optional
   * (defaults to null) so `Header` still satisfies the registry's generic
   * `ComponentType<{ data: HeaderData }>` slot (`src/content/registry.ts`,
   * out of scope for this change) — only `(public)/layout.tsx` passes it.
   */
  productsMenu?: PublicCategory[] | null;
};

/**
 * Server entry point for the registry. All interactivity (scroll shadow,
 * mobile drawer, products mega-menu) lives in the client island `HeaderBar`.
 * Matches Figma node 313:849.
 */
export default function Header({ data, productsMenu = null }: HeaderProps) {
  return <HeaderBar data={data} productsMenu={productsMenu} />;
}
