import { Request, Response } from "express";
import { asyncErrorHandler } from "@utils/asyncHandler/asyncHandler";
import { MESSAGES, STATUS_CODES } from "@src/constants";
import * as services from "./services";

export const listAdmin = asyncErrorHandler(async (_req: Request, res: Response) => {
  const categories = await services.listAdmin();

  return res.status(STATUS_CODES.SUCCESS).json({
    message: MESSAGES.success,
    data: { categories },
  });
});

export const create = asyncErrorHandler(async (req: Request, res: Response) => {
  const category = await services.create(req.body, req.userId as string);

  return res.status(STATUS_CODES.CREATED).json({
    message: MESSAGES.success,
    data: { category },
  });
});

export const update = asyncErrorHandler(async (req: Request, res: Response) => {
  const { rev, ...input } = req.body;
  const category = await services.update(req.params.id, input, rev, req.userId as string);

  return res.status(STATUS_CODES.SUCCESS).json({
    message: MESSAGES.success,
    data: { category },
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
  const categories = await services.reorder(req.body.ids);

  return res.status(STATUS_CODES.SUCCESS).json({
    message: MESSAGES.success,
    data: { categories },
  });
});
