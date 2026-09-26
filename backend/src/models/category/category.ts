import { Schema, Document, model } from "mongoose";
import * as interfaces from "./interface";

export interface ICategory extends interfaces.ICategoryInterface, Document {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * One document per product Category (API_CONTRACT §6). `order` is 0-based
 * and defines both the public category order and the admin list order —
 * `create` appends, `reorder` rewrites the whole set with one bulkWrite.
 * `rev` guards concurrent admin edits exactly like a page section's rev.
 */
const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, default: "" },
    slug: { type: String, required: true },
    description: { type: String, required: true, default: "" },
    order: { type: Number, required: true, default: 0 },
    rev: { type: Number, required: true, default: 0 },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ order: 1 });

const Category = model<ICategory>("Category", categorySchema);

export default Category;
