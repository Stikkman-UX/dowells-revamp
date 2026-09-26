import { Types } from "mongoose";

/**
 * A Category owns ordered Products (API_CONTRACT §6). Categories are entity
 * records — not page-registry sections — so they get their own collection.
 */
export interface ICategoryInterface {
  name: string;
  slug: string;
  description: string;
  order: number;
  rev: number;
  updatedBy: Types.ObjectId | null;
}
