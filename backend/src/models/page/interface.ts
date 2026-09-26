import { Types } from "mongoose";

/** Stored form of a MediaRef (API_CONTRACT §4.1) — the resolved shape (with
 *  url/mimeType/fileType) is never persisted, only assetId + alt. */
export interface IStoredMediaRef {
  assetId: string;
  alt: string;
}

export interface ISeo {
  title: string;
  description: string;
  canonical: string;
  noindex: boolean;
  ogImage: IStoredMediaRef | null;
}

/**
 * One CMS section on a page. `data` is the section's stored (zod-validated)
 * payload — shape depends on the section's registered schema (@controllers
 * /page/registry.ts), so it is Mixed at the DB layer.
 */
export interface IPageSection {
  isVisible: boolean;
  data: unknown;
  rev: number;
  updatedAt: Date;
}

export interface IPageInterface {
  slug: string;
  seo: ISeo;
  sections: Map<string, IPageSection>;
  updatedBy: Types.ObjectId | null;
}
