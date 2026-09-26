import { Types } from "mongoose";
import { ISeo } from "@models/page/interface";

/**
 * A Product belongs to exactly one Category (API_CONTRACT §6). Content
 * blocks (hero/downloads/specs/deployed/safety) are stored as-is — their
 * shape is owned by the zod schema in controllers/product/schema.ts, the
 * same philosophy as a page section's `data`.
 */
export interface IProductInterface {
  categoryId: Types.ObjectId;
  name: string;
  slug: string;
  subtitle: string;
  isPublished: boolean;
  order: number;
  seo: ISeo;
  hero: unknown;
  downloads: unknown;
  specs: unknown;
  deployed: unknown;
  safety: unknown;
  rev: number;
  updatedBy: Types.ObjectId | null;
}
