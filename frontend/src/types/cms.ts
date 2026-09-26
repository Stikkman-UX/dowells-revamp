/**
 * Types mirrored from API_CONTRACT.md. Keep these in sync with the contract —
 * it is the source of truth, not this file.
 *
 * Two "shapes" exist for content that references media:
 * - Stored form (`MediaRef` / `Media`): what the admin sends back to the API.
 * - Resolved form (`ResolvedMedia`): what every GET returns, and what every
 *   frontend component consumes.
 */

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

export type FileType = "Image" | "Video" | "Document";

export type MediaRef = { assetId: string; alt: string };
export type Media = MediaRef | null;

export type ResolvedMedia = {
  assetId: string;
  alt: string;
  url: string;
  mimeType: string;
  fileType: FileType;
  fileSize: number;
} | null;

export type HighlightText = { text: string; highlight: string };

export type LinkItem = { label: string; href: string };

export type Button = {
  text: string;
  href: string;
  withIcon: boolean;
  icon: ResolvedMedia;
  iconPosition: "left" | "right";
  openInNewTab: boolean;
};

/** A Button whose colour the admin picks (e.g. hero CTAs) instead of the layout slot. */
export type CtaButton = Button & { variant: "red" | "white" };

export type Stat = { value: string; label: string };

// ---------------------------------------------------------------------------
// Assets
// ---------------------------------------------------------------------------

export type Asset = {
  assetId: string;
  url: string;
  mimeType: string;
  fileType: FileType;
  originalName: string;
  fileSize: number;
  createdAt: string;
  updatedAt: string;
};

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export type User = {
  _id: string;
  name: string;
  email: string;
  userType: "Admin" | "Moderator";
};

// ---------------------------------------------------------------------------
// Pages / sections
// ---------------------------------------------------------------------------

export type Seo = {
  title: string;
  description: string;
  canonical: string;
  noindex: boolean;
  ogImage: Media;
};

export type ResolvedSeo = {
  title: string;
  description: string;
  canonical: string;
  noindex: boolean;
  ogImage: ResolvedMedia;
};

export type PublicSection<TData = unknown> =
  | { isVisible: true; data: TData }
  | { isVisible: false };

export type AdminSection<TData = unknown> = {
  isVisible: boolean;
  data: TData;
  rev: number;
  updatedAt: string | null;
};

export type PageKind = "global" | "page";

export type PublicPageResponse<
  TSections extends Record<string, unknown> = Record<string, unknown>,
> = {
  slug: string;
  title: string;
  seo: ResolvedSeo;
  sections: { [K in keyof TSections]?: PublicSection<TSections[K]> };
  updatedAt: string | null;
};

export type AdminPageResponse<
  TSections extends Record<string, unknown> = Record<string, unknown>,
> = {
  slug: string;
  title: string;
  kind: PageKind;
  path: string;
  seo: ResolvedSeo;
  sections: { [K in keyof TSections]: AdminSection<TSections[K]> };
  updatedAt: string | null;
};

export type AdminPageListItem = {
  slug: string;
  title: string;
  kind: PageKind;
  path: string | null;
  sectionKeys: string[];
  updatedAt: string | null;
};

// ---------------------------------------------------------------------------
// Section data — _global
// ---------------------------------------------------------------------------

export type HeaderData = {
  logo: ResolvedMedia;
  logoHref: string;
  navItems: { label: string; href: string; showChevron: boolean }[];
  showSearch: boolean;
  searchHref: string;
  ctaButton: Button;
};

export type FooterData = {
  newsletter: { heading: string; placeholder: string; button: Button };
  logo: ResolvedMedia;
  description: string;
  phone: string;
  email: string;
  socials: { icon: ResolvedMedia; label: string; href: string }[];
  columns: { title: string; links: LinkItem[] }[];
  copyright: string;
  legalLinks: LinkItem[];
};

/** The site-wide product catalogue PDF, rendered on every product page (API_CONTRACT §4.4/§6). */
export type CatalogueData = {
  title: string;
  caption: string;
  file: ResolvedMedia;
  button: Button;
};

export type GlobalSections = {
  header: HeaderData;
  footer: FooterData;
  catalogue: CatalogueData;
};

// ---------------------------------------------------------------------------
// Section data — home
// ---------------------------------------------------------------------------

export type HeroData = {
  heading: HighlightText;
  buttons: CtaButton[];
  stats: Stat[];
  carousel: {
    media: ResolvedMedia;
    poster: ResolvedMedia;
  }[];
};

export type AboutData = {
  eyebrowLeft: string;
  partnerLogo: ResolvedMedia;
  eyebrowRight: string;
  statement: HighlightText;
  button: Button;
  image: ResolvedMedia;
  clientsCaption: string;
  clients: { name: string }[];
};

export type QuickAccessData = {
  heading: string;
  description: string;
  searchCard: {
    icon: ResolvedMedia;
    title: string;
    subtitle: string;
    placeholder: string;
    buttonLabel: string;
    image: ResolvedMedia;
    href: string;
  };
  cards: {
    icon: ResolvedMedia;
    title: string;
    subtitle: string;
    image: ResolvedMedia;
    href: string;
  }[];
};

export type IndustriesData = {
  heading: string;
  slides: {
    image: ResolvedMedia;
    title: string;
    description: string;
    href: string;
  }[];
};

export type ProductCategoriesData = {
  heading: string;
  categories: {
    name: string;
    countLabel: string;
    badge: string;
    description: string;
    image: ResolvedMedia;
    button: Button;
  }[];
};

export type ImpactData = {
  heading: string;
  button: Button;
  cards: {
    image: ResolvedMedia;
    tag: string;
    title: string;
    meta: string;
    href: string;
  }[];
};

export type TrustData = {
  eyebrow: string;
  heading: string;
  description: string;
  certifications: { icon: ResolvedMedia; label: string }[];
  stats: Stat[];
  image: ResolvedMedia;
};

export type InsightsData = {
  heading: string;
  allLabel: string;
  filterTags: string[];
  articles: {
    image: ResolvedMedia;
    tag: string;
    dateLabel: string;
    title: string;
    button: Button;
  }[];
};

export type HomeSections = {
  hero: HeroData;
  about: AboutData;
  quickAccess: QuickAccessData;
  industries: IndustriesData;
  productCategories: ProductCategoriesData;
  impact: ImpactData;
  trust: TrustData;
  insights: InsightsData;
};

// ---------------------------------------------------------------------------
// Error envelope
// ---------------------------------------------------------------------------

export type ApiErrorEnvelope = {
  status: string;
  statusCode: number;
  message: string;
  errors?: { path: string; message: string }[];
};
