import { Types } from "mongoose";
import Category from "@models/category/category";
import Product from "@models/product/product";
import { OperationalError, ValidationFailed } from "@utils/error/errorInstances";
import { MESSAGES, STATUS_CODES } from "@src/constants";
import { CategoryInputData } from "./validator";

/**
 * Business logic for Categories (API_CONTRACT §6). Only this file throws;
 * the controller stays thin. Writes are rev-guarded exactly like a page
 * section save — see backend/CLAUDE.md "Products (entity module)".
 */

const MONGO_DUPLICATE_KEY_ERROR_CODE = 11000;

type LeanCategory = {
  _id: unknown;
  name: string;
  slug: string;
  description: string;
  order: number;
  rev: number;
  createdAt: Date;
  updatedAt: Date;
};

export type AdminCategoryResponse = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  order: number;
  productCount: number;
  rev: number;
  createdAt: string;
  updatedAt: string;
};

const toResponse = (doc: LeanCategory, productCount: number): AdminCategoryResponse => ({
  _id: String(doc._id),
  name: doc.name,
  slug: doc.slug,
  description: doc.description,
  order: doc.order,
  productCount,
  rev: doc.rev,
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString(),
});

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  (error as { code?: number }).code === MONGO_DUPLICATE_KEY_ERROR_CODE;

// ---- reads -----------------------------------------------------------------

export const listAdmin = async (): Promise<AdminCategoryResponse[]> => {
  const [categories, counts] = await Promise.all([
    Category.find({}).sort({ order: 1 }).lean<LeanCategory[]>().exec(),
    Product.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $group: { _id: "$categoryId", count: { $sum: 1 } } },
    ]),
  ]);

  const countByCategoryId = new Map(counts.map((entry) => [String(entry._id), entry.count]));

  return categories.map((doc) => toResponse(doc, countByCategoryId.get(String(doc._id)) ?? 0));
};

// ---- writes ------------------------------------------------------------------

export const create = async (
  input: CategoryInputData,
  actorId: string
): Promise<AdminCategoryResponse> => {
  const slugOwner = await Category.findOne({ slug: input.slug }).lean().exec();
  if (slugOwner) {
    throw new OperationalError(STATUS_CODES.CONFLICT, MESSAGES.slugConflict);
  }

  const order = await Category.countDocuments({});
  const now = new Date();

  const doc: LeanCategory = {
    _id: new Types.ObjectId(),
    name: input.name,
    slug: input.slug,
    description: input.description,
    order,
    rev: 0,
    createdAt: now,
    updatedAt: now,
  };

  // Inserted through the raw driver (never Model.create()/doc.save()) —
  // content is validated by zod, not by Mongoose's own schema validation.
  // Mongoose's built-in `required` check on a String rejects "" (a category
  // legitimately starts with an empty description), which only ever
  // surfaces via full document validation — the page module avoids it for
  // the same reason by writing exclusively through $set. The unique `slug`
  // index is still enforced by MongoDB itself, so the E11000 race is still
  // caught below.
  try {
    await Category.collection.insertOne({ ...doc, updatedBy: new Types.ObjectId(actorId) } as any);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new OperationalError(STATUS_CODES.CONFLICT, MESSAGES.slugConflict);
    }
    throw error;
  }

  return toResponse(doc, 0);
};

export const update = async (
  id: string,
  input: CategoryInputData,
  rev: number,
  actorId: string
): Promise<AdminCategoryResponse> => {
  const existing = await Category.findById(id).lean<LeanCategory | null>().exec();
  if (!existing) {
    throw new OperationalError(STATUS_CODES.NOT_FOUND, MESSAGES.categoryNotFound);
  }

  const slugOwner = await Category.findOne({ slug: input.slug, _id: { $ne: id } })
    .lean()
    .exec();
  if (slugOwner) {
    throw new OperationalError(STATUS_CODES.CONFLICT, MESSAGES.slugConflict);
  }

  let updated: LeanCategory | null;
  try {
    updated = await Category.findOneAndUpdate(
      { _id: id, rev },
      {
        $set: {
          name: input.name,
          slug: input.slug,
          description: input.description,
          updatedBy: new Types.ObjectId(actorId),
        },
        $inc: { rev: 1 },
      },
      { new: true }
    )
      .lean<LeanCategory | null>()
      .exec();
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new OperationalError(STATUS_CODES.CONFLICT, MESSAGES.slugConflict);
    }
    throw error;
  }

  if (!updated) {
    throw new OperationalError(STATUS_CODES.CONFLICT, MESSAGES.staleRevision);
  }

  const productCount = await Product.countDocuments({ categoryId: id });
  return toResponse(updated, productCount);
};

export const remove = async (id: string): Promise<void> => {
  const existing = await Category.findById(id).lean().exec();
  if (!existing) {
    throw new OperationalError(STATUS_CODES.NOT_FOUND, MESSAGES.categoryNotFound);
  }

  const productCount = await Product.countDocuments({ categoryId: id });
  if (productCount > 0) {
    throw new OperationalError(STATUS_CODES.CONFLICT, MESSAGES.categoryHasProducts);
  }

  await Category.deleteOne({ _id: id });
};

export const reorder = async (ids: string[]): Promise<AdminCategoryResponse[]> => {
  const existing = await Category.find({}, { _id: 1 }).lean<{ _id: unknown }[]>().exec();
  const existingIds = new Set(existing.map((doc) => String(doc._id)));
  const incomingIds = new Set(ids);

  if (existingIds.size !== incomingIds.size || ids.some((id) => !existingIds.has(id))) {
    throw new ValidationFailed(STATUS_CODES.VALIDATION_FAILED, MESSAGES.validationFailed, [
      { path: "ids", message: MESSAGES.reorderIdsMismatch },
    ]);
  }

  await Category.bulkWrite(
    ids.map((id, index) => ({
      updateOne: { filter: { _id: id }, update: { $set: { order: index } } },
    }))
  );

  return listAdmin();
};
