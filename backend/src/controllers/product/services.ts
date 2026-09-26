import { Types } from "mongoose";
import Category from "@models/category/category";
import Product from "@models/product/product";
import { AssetResponse } from "@controllers/asset/assetService";
import { collectAssetIssues, loadAssetMap, resolveMedia } from "@controllers/page/mediaRefs";
import { OperationalError, ValidationFailed } from "@utils/error/errorInstances";
import { MESSAGES, STATUS_CODES } from "@src/constants";
import { ProductInputData } from "./schema";

/**
 * Business logic for Products (API_CONTRACT §6). Only this file throws; the
 * controller stays thin. Every write follows the same pipeline as a page
 * section save (services.ts putSection): zod already ran in the router,
 * then loadAssetMap -> collectAssetIssues(parsed, map, "") (no "data."
 * prefix here, unlike page sections) -> rev-guarded findOneAndUpdate.
 */

const MONGO_DUPLICATE_KEY_ERROR_CODE = 11000;
const PUBLIC_CATEGORY_CAP = 50;
const PUBLIC_PRODUCTS_PER_CATEGORY_CAP = 200;
const ADMIN_PRODUCT_LIST_CAP = 500;

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  (error as { code?: number }).code === MONGO_DUPLICATE_KEY_ERROR_CODE;

// ---- lean read shapes -------------------------------------------------------

type LeanCategory = {
  _id: unknown;
  name: string;
  slug: string;
  description: string;
  order: number;
};

type LeanProduct = {
  _id: unknown;
  categoryId: unknown;
  name: string;
  slug: string;
  subtitle: string;
  isPublished: boolean;
  order: number;
  seo: unknown;
  hero: unknown;
  downloads: unknown;
  specs: unknown;
  deployed: unknown;
  safety: unknown;
  rev: number;
  createdAt: Date;
  updatedAt: Date;
};

// ---- response shapes (API_CONTRACT §6.1) -----------------------------------

export type ProductSummary = { _id: string; name: string; slug: string; subtitle: string };

export type PublicCategoryResponse = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  products: ProductSummary[];
};

export type PublicProductResponse = {
  _id: string;
  name: string;
  slug: string;
  subtitle: string;
  updatedAt: string;
  category: { _id: string; name: string; slug: string; description: string };
  seo: unknown;
  hero: unknown;
  downloads: unknown;
  specs: unknown;
  deployed: unknown;
  safety: unknown;
};

export type SimilarProductResponse = ProductSummary & { thumbnail: unknown };

export type AdminProductListItem = {
  _id: string;
  name: string;
  slug: string;
  subtitle: string;
  categoryId: string;
  category: { name: string; slug: string };
  isPublished: boolean;
  order: number;
  rev: number;
  updatedAt: string;
};

export type AdminProductResponse = {
  _id: string;
  categoryId: string;
  name: string;
  slug: string;
  subtitle: string;
  isPublished: boolean;
  order: number;
  rev: number;
  createdAt: string;
  updatedAt: string;
  seo: unknown;
  hero: unknown;
  downloads: unknown;
  specs: unknown;
  deployed: unknown;
  safety: unknown;
};

const toAdminProductResponse = (
  doc: LeanProduct,
  assetMap: Map<string, AssetResponse>
): AdminProductResponse => ({
  _id: String(doc._id),
  categoryId: String(doc.categoryId),
  name: doc.name,
  slug: doc.slug,
  subtitle: doc.subtitle,
  isPublished: doc.isPublished,
  order: doc.order,
  rev: doc.rev,
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString(),
  seo: resolveMedia(doc.seo, assetMap),
  hero: resolveMedia(doc.hero, assetMap),
  downloads: resolveMedia(doc.downloads, assetMap),
  specs: resolveMedia(doc.specs, assetMap),
  deployed: resolveMedia(doc.deployed, assetMap),
  safety: resolveMedia(doc.safety, assetMap),
});

// ---- public reads (API_CONTRACT §6.2) --------------------------------------

export const listPublicCategories = async (): Promise<PublicCategoryResponse[]> => {
  const categories = await Category.find({})
    .sort({ order: 1 })
    .limit(PUBLIC_CATEGORY_CAP)
    .lean<LeanCategory[]>()
    .exec();

  if (!categories.length) return [];

  const categoryIds = categories.map((category) => category._id);

  const products = await Product.find(
    { categoryId: { $in: categoryIds }, isPublished: true },
    { name: 1, slug: 1, subtitle: 1, categoryId: 1, order: 1 }
  )
    .sort({ order: 1 })
    .lean<Array<Pick<LeanProduct, "_id" | "name" | "slug" | "subtitle" | "categoryId">>>()
    .exec();

  const productsByCategoryId = new Map<string, ProductSummary[]>();
  for (const product of products) {
    const key = String(product.categoryId);
    const list = productsByCategoryId.get(key) ?? [];
    if (list.length < PUBLIC_PRODUCTS_PER_CATEGORY_CAP) {
      list.push({
        _id: String(product._id),
        name: product.name,
        slug: product.slug,
        subtitle: product.subtitle,
      });
    }
    productsByCategoryId.set(key, list);
  }

  const result: PublicCategoryResponse[] = [];
  for (const category of categories) {
    const categoryProducts = productsByCategoryId.get(String(category._id)) ?? [];
    if (!categoryProducts.length) continue; // a category with 0 published products is not public

    result.push({
      _id: String(category._id),
      name: category.name,
      slug: category.slug,
      description: category.description,
      products: categoryProducts,
    });
  }

  return result;
};

export const getPublicProduct = async (
  categorySlug: string,
  productSlug: string
): Promise<{ product: PublicProductResponse; similar: SimilarProductResponse[] }> => {
  const category = await Category.findOne({ slug: categorySlug }).lean<LeanCategory | null>().exec();
  if (!category) {
    throw new OperationalError(STATUS_CODES.NOT_FOUND, MESSAGES.categoryNotFound);
  }

  const product = await Product.findOne({
    categoryId: category._id,
    slug: productSlug,
    isPublished: true,
  })
    .lean<LeanProduct | null>()
    .exec();

  if (!product) {
    throw new OperationalError(STATUS_CODES.NOT_FOUND, MESSAGES.productNotFound);
  }

  const similarDocs = await Product.find(
    { categoryId: category._id, isPublished: true, _id: { $ne: product._id } },
    { name: 1, slug: 1, subtitle: 1, "hero.image": 1 }
  )
    .sort({ order: 1 })
    .lean<Array<Pick<LeanProduct, "_id" | "name" | "slug" | "subtitle"> & { hero?: { image?: unknown } }>>()
    .exec();

  // ONE loadAssetMap call for the product's own content + every similar
  // product's thumbnail (API_CONTRACT §6.2 / backend/CLAUDE.md).
  const assetMap = await loadAssetMap([
    product.hero,
    product.downloads,
    product.specs,
    product.deployed,
    product.safety,
    product.seo,
    ...similarDocs.map((doc) => doc.hero?.image ?? null),
  ]);

  const similar: SimilarProductResponse[] = similarDocs.map((doc) => ({
    _id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    subtitle: doc.subtitle,
    thumbnail: resolveMedia(doc.hero?.image ?? null, assetMap),
  }));

  const productResponse: PublicProductResponse = {
    _id: String(product._id),
    name: product.name,
    slug: product.slug,
    subtitle: product.subtitle,
    updatedAt: product.updatedAt.toISOString(),
    category: {
      _id: String(category._id),
      name: category.name,
      slug: category.slug,
      description: category.description,
    },
    seo: resolveMedia(product.seo, assetMap),
    hero: resolveMedia(product.hero, assetMap),
    downloads: resolveMedia(product.downloads, assetMap),
    specs: resolveMedia(product.specs, assetMap),
    deployed: resolveMedia(product.deployed, assetMap),
    safety: resolveMedia(product.safety, assetMap),
  };

  return { product: productResponse, similar };
};

// ---- admin reads -------------------------------------------------------------

export const listAdmin = async (categoryId?: string): Promise<AdminProductListItem[]> => {
  const filter: Record<string, unknown> = {};
  if (categoryId) filter.categoryId = categoryId;

  const [categories, products] = await Promise.all([
    Category.find({}, { name: 1, slug: 1, order: 1 })
      .lean<Array<Pick<LeanCategory, "_id" | "name" | "slug" | "order">>>()
      .exec(),
    Product.find(filter, {
      name: 1,
      slug: 1,
      subtitle: 1,
      categoryId: 1,
      isPublished: 1,
      order: 1,
      rev: 1,
      updatedAt: 1,
    })
      .limit(ADMIN_PRODUCT_LIST_CAP)
      .lean<
        Array<
          Pick<
            LeanProduct,
            "_id" | "name" | "slug" | "subtitle" | "categoryId" | "isPublished" | "order" | "rev" | "updatedAt"
          >
        >
      >()
      .exec(),
  ]);

  const categoryById = new Map(categories.map((category) => [String(category._id), category]));

  const sorted = [...products].sort((a, b) => {
    const orderA = categoryById.get(String(a.categoryId))?.order ?? 0;
    const orderB = categoryById.get(String(b.categoryId))?.order ?? 0;
    if (orderA !== orderB) return orderA - orderB;
    return a.order - b.order;
  });

  return sorted.map((product) => {
    const category = categoryById.get(String(product.categoryId));
    return {
      _id: String(product._id),
      name: product.name,
      slug: product.slug,
      subtitle: product.subtitle,
      categoryId: String(product.categoryId),
      category: { name: category?.name ?? "", slug: category?.slug ?? "" },
      isPublished: product.isPublished,
      order: product.order,
      rev: product.rev,
      updatedAt: product.updatedAt.toISOString(),
    };
  });
};

export const getAdmin = async (id: string): Promise<AdminProductResponse> => {
  const product = await Product.findById(id).lean<LeanProduct | null>().exec();
  if (!product) {
    throw new OperationalError(STATUS_CODES.NOT_FOUND, MESSAGES.productNotFound);
  }

  const assetMap = await loadAssetMap([
    product.hero,
    product.downloads,
    product.specs,
    product.deployed,
    product.safety,
    product.seo,
  ]);

  return toAdminProductResponse(product, assetMap);
};

// ---- writes ------------------------------------------------------------------

const validateProductAssets = async (
  input: ProductInputData
): Promise<Map<string, AssetResponse>> => {
  const assetMap = await loadAssetMap([input]);
  const issues = collectAssetIssues(input, assetMap, "");
  if (issues.length) {
    throw new ValidationFailed(STATUS_CODES.VALIDATION_FAILED, MESSAGES.validationFailed, issues);
  }
  return assetMap;
};

const requireCategory = async (categoryId: string): Promise<void> => {
  const category = await Category.findById(categoryId).lean().exec();
  if (!category) {
    throw new ValidationFailed(STATUS_CODES.VALIDATION_FAILED, MESSAGES.validationFailed, [
      { path: "categoryId", message: MESSAGES.categoryNotFound },
    ]);
  }
};

export const create = async (
  input: ProductInputData,
  actorId: string
): Promise<AdminProductResponse> => {
  await requireCategory(input.categoryId);

  const slugOwner = await Product.findOne({ categoryId: input.categoryId, slug: input.slug })
    .lean()
    .exec();
  if (slugOwner) {
    throw new OperationalError(STATUS_CODES.CONFLICT, MESSAGES.slugConflict);
  }

  const assetMap = await validateProductAssets(input);

  const order = await Product.countDocuments({ categoryId: input.categoryId });
  const now = new Date();

  const doc: LeanProduct = {
    _id: new Types.ObjectId(),
    categoryId: new Types.ObjectId(input.categoryId),
    name: input.name,
    slug: input.slug,
    subtitle: input.subtitle,
    isPublished: input.isPublished,
    order,
    seo: input.seo,
    hero: input.hero,
    downloads: input.downloads,
    specs: input.specs,
    deployed: input.deployed,
    safety: input.safety,
    rev: 0,
    createdAt: now,
    updatedAt: now,
  };

  // Raw driver insert (never Model.create()/doc.save()) — see the identical
  // note in controllers/category/services.ts: Mongoose's built-in `required`
  // check on a String rejects "" (every content block starts out empty),
  // which only surfaces via full document validation. zod already validated
  // `input`; the unique {categoryId, slug} index is still enforced by
  // MongoDB, so the E11000 race is still caught below.
  try {
    await Product.collection.insertOne({ ...doc, updatedBy: new Types.ObjectId(actorId) } as any);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new OperationalError(STATUS_CODES.CONFLICT, MESSAGES.slugConflict);
    }
    throw error;
  }

  return toAdminProductResponse(doc, assetMap);
};

export const update = async (
  id: string,
  input: ProductInputData,
  rev: number,
  actorId: string
): Promise<AdminProductResponse> => {
  const existing = await Product.findById(id).lean<LeanProduct | null>().exec();
  if (!existing) {
    throw new OperationalError(STATUS_CODES.NOT_FOUND, MESSAGES.productNotFound);
  }

  await requireCategory(input.categoryId);

  const slugOwner = await Product.findOne({
    categoryId: input.categoryId,
    slug: input.slug,
    _id: { $ne: id },
  })
    .lean()
    .exec();
  if (slugOwner) {
    throw new OperationalError(STATUS_CODES.CONFLICT, MESSAGES.slugConflict);
  }

  const assetMap = await validateProductAssets(input);

  const categoryChanged = String(existing.categoryId) !== input.categoryId;
  const order = categoryChanged
    ? await Product.countDocuments({ categoryId: input.categoryId })
    : existing.order;

  let updated: LeanProduct | null;
  try {
    updated = await Product.findOneAndUpdate(
      { _id: id, rev },
      {
        $set: {
          categoryId: input.categoryId,
          name: input.name,
          slug: input.slug,
          subtitle: input.subtitle,
          isPublished: input.isPublished,
          order,
          seo: input.seo,
          hero: input.hero,
          downloads: input.downloads,
          specs: input.specs,
          deployed: input.deployed,
          safety: input.safety,
          updatedBy: new Types.ObjectId(actorId),
        },
        $inc: { rev: 1 },
      },
      { new: true }
    )
      .lean<LeanProduct | null>()
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

  return toAdminProductResponse(updated, assetMap);
};

export const setPublished = async (
  id: string,
  isPublished: boolean,
  rev: number
): Promise<AdminProductListItem> => {
  const existing = await Product.findById(id).lean().exec();
  if (!existing) {
    throw new OperationalError(STATUS_CODES.NOT_FOUND, MESSAGES.productNotFound);
  }

  const updated = await Product.findOneAndUpdate(
    { _id: id, rev },
    { $set: { isPublished }, $inc: { rev: 1 } },
    { new: true }
  )
    .lean<LeanProduct | null>()
    .exec();

  if (!updated) {
    throw new OperationalError(STATUS_CODES.CONFLICT, MESSAGES.staleRevision);
  }

  const category = await Category.findById(updated.categoryId, { name: 1, slug: 1 })
    .lean<Pick<LeanCategory, "_id" | "name" | "slug"> | null>()
    .exec();

  return {
    _id: String(updated._id),
    name: updated.name,
    slug: updated.slug,
    subtitle: updated.subtitle,
    categoryId: String(updated.categoryId),
    category: { name: category?.name ?? "", slug: category?.slug ?? "" },
    isPublished: updated.isPublished,
    order: updated.order,
    rev: updated.rev,
    updatedAt: updated.updatedAt.toISOString(),
  };
};

export const remove = async (id: string): Promise<void> => {
  const existing = await Product.findById(id).lean().exec();
  if (!existing) {
    throw new OperationalError(STATUS_CODES.NOT_FOUND, MESSAGES.productNotFound);
  }

  await Product.deleteOne({ _id: id });
};

export const reorder = async (categoryId: string, ids: string[]): Promise<AdminProductListItem[]> => {
  const existing = await Product.find({ categoryId }, { _id: 1 }).lean<{ _id: unknown }[]>().exec();
  const existingIds = new Set(existing.map((doc) => String(doc._id)));
  const incomingIds = new Set(ids);

  if (existingIds.size !== incomingIds.size || ids.some((id) => !existingIds.has(id))) {
    throw new ValidationFailed(STATUS_CODES.VALIDATION_FAILED, MESSAGES.validationFailed, [
      { path: "ids", message: MESSAGES.reorderIdsMismatch },
    ]);
  }

  await Product.bulkWrite(
    ids.map((id, index) => ({
      updateOne: { filter: { _id: id }, update: { $set: { order: index } } },
    }))
  );

  return listAdmin(categoryId);
};
