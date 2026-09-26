import { Schema, Document, model } from "mongoose";
import { seoSchema } from "@models/page/page";
import * as interfaces from "./interface";

export interface IProduct extends interfaces.IProductInterface, Document {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * One document per Product (API_CONTRACT §6). `hero/downloads/specs/
 * deployed/safety` are Mixed — their shape is owned by the zod schema in
 * controllers/product/schema.ts, not by Mongoose (same philosophy as
 * Page.sections.<key>.data). `minimize: false` so a block whose zod-valid
 * data happens to be `{}`-shaped isn't silently pruned by Mongoose.
 */
const productSchema = new Schema<IProduct>(
  {
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    name: { type: String, required: true, default: "" },
    slug: { type: String, required: true },
    subtitle: { type: String, required: true, default: "" },
    isPublished: { type: Boolean, required: true, default: false },
    order: { type: Number, required: true, default: 0 },
    seo: { type: seoSchema, required: true, default: () => ({}) },
    hero: { type: Schema.Types.Mixed, required: true },
    downloads: { type: Schema.Types.Mixed, required: true },
    specs: { type: Schema.Types.Mixed, required: true },
    deployed: { type: Schema.Types.Mixed, required: true },
    safety: { type: Schema.Types.Mixed, required: true },
    rev: { type: Number, required: true, default: 0 },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true, minimize: false }
);

productSchema.index({ categoryId: 1, slug: 1 }, { unique: true });
productSchema.index({ categoryId: 1, isPublished: 1, order: 1 });

const Product = model<IProduct>("Product", productSchema);

export default Product;
