import { Schema, Document, model } from "mongoose";
import * as interfaces from "./interface";

export interface IPage extends interfaces.IPageInterface, Document {
  createdAt: Date;
  updatedAt: Date;
}

const mediaRefSchema = new Schema<interfaces.IStoredMediaRef>(
  {
    assetId: { type: String, required: true },
    alt: { type: String, required: true, default: "" },
  },
  { _id: false }
);

export const seoSchema = new Schema<interfaces.ISeo>(
  {
    title: { type: String, required: true, default: "" },
    description: { type: String, required: true, default: "" },
    canonical: { type: String, required: true, default: "" },
    noindex: { type: Boolean, required: true, default: false },
    ogImage: { type: mediaRefSchema, default: null },
  },
  { _id: false }
);

const pageSectionSchema = new Schema<interfaces.IPageSection>(
  {
    isVisible: { type: Boolean, required: true, default: true },
    // Shape is owned by the section's registered zod schema, not by
    // Mongoose — see src/controllers/page/registry.ts.
    data: { type: Schema.Types.Mixed, required: true },
    rev: { type: Number, required: true, default: 0 },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false }
);

/**
 * One document per registered page slug (API_CONTRACT §4.2). `sections` is
 * keyed by section key (`hero`, `header`, ...) so adding a page/section is a
 * registry change only — never a schema migration. `minimize: false` so a
 * section whose zod-valid data happens to be `{}`-shaped isn't silently
 * dropped by Mongoose's empty-object pruning.
 */
const pageSchema = new Schema<IPage>(
  {
    slug: { type: String, required: true },
    seo: { type: seoSchema, required: true, default: () => ({}) },
    sections: {
      type: Map,
      of: pageSectionSchema,
      required: true,
      default: () => new Map(),
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true, minimize: false }
);

pageSchema.index({ slug: 1 }, { unique: true });

const Page = model<IPage>("Page", pageSchema);

export default Page;
