import { Request, Response } from "express";
import { asyncErrorHandler } from "@utils/asyncHandler/asyncHandler";
import { MESSAGES, STATUS_CODES } from "@src/constants";
import * as services from "./services";

// ---- public (API_CONTRACT §6.2) --------------------------------------------

export const listPublicCategories = asyncErrorHandler(async (_req: Request, res: Response) => {
  const categories = await services.listPublicCategories();

  return res.status(STATUS_CODES.SUCCESS).json({
    message: MESSAGES.success,
    data: { categories },
  });
});

export const getPublicProduct = asyncErrorHandler(async (req: Request, res: Response) => {
  const { product, similar } = await services.getPublicProduct(
    req.params.categorySlug,
    req.params.productSlug
  );

  return res.status(STATUS_CODES.SUCCESS).json({
    message: MESSAGES.success,
    data: { product, similar },
  });
});

// ---- admin ------------------------------------------------------------------

export const listAdmin = asyncErrorHandler(async (req: Request, res: Response) => {
  const categoryId = req.query.categoryId as string | undefined;
  const products = await services.listAdmin(categoryId);

  return res.status(STATUS_CODES.SUCCESS).json({
    message: MESSAGES.success,
    data: { products },
  });
});

export const getAdmin = asyncErrorHandler(async (req: Request, res: Response) => {
  const product = await services.getAdmin(req.params.id);

  return res.status(STATUS_CODES.SUCCESS).json({
    message: MESSAGES.success,
    data: { product },
  });
});

export const create = asyncErrorHandler(async (req: Request, res: Response) => {
  const product = await services.create(req.body, req.userId as string);

  return res.status(STATUS_CODES.CREATED).json({
    message: MESSAGES.success,
    data: { product },
  });
});

export const update = asyncErrorHandler(async (req: Request, res: Response) => {
  const { rev, ...input } = req.body;
  const product = await services.update(req.params.id, input, rev, req.userId as string);

  return res.status(STATUS_CODES.SUCCESS).json({
    message: MESSAGES.success,
    data: { product },
  });
});

export const setPublished = asyncErrorHandler(async (req: Request, res: Response) => {
  const product = await services.setPublished(req.params.id, req.body.isPublished, req.body.rev);

  return res.status(STATUS_CODES.SUCCESS).json({
    message: MESSAGES.success,
    data: { product },
  });
});

export const remove = asyncErrorHandler(async (req: Request, res: Response) => {
  await services.remove(req.params.id);

  return res.status(STATUS_CODES.SUCCESS).json({
    message: MESSAGES.success,
    data: {},
  });
});

export const reorder = asyncErrorHandler(async (req: Request, res: Response) => {
  const products = await services.reorder(req.body.categoryId, req.body.ids);

  return res.status(STATUS_CODES.SUCCESS).json({
    message: MESSAGES.success,
    data: { products },
  });
});
