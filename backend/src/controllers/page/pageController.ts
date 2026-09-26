import { Request, Response } from "express";
import { asyncErrorHandler } from "@utils/asyncHandler/asyncHandler";
import { MESSAGES, STATUS_CODES } from "@src/constants";
import * as services from "./services";

export const getPublicPage = asyncErrorHandler(async (req: Request, res: Response) => {
  const page = await services.getPublicPage(req.params.slug);

  return res.status(STATUS_CODES.SUCCESS).json({
    message: MESSAGES.success,
    data: page,
  });
});

export const listAdminPages = asyncErrorHandler(async (_req: Request, res: Response) => {
  const pages = await services.listAdminPages();

  return res.status(STATUS_CODES.SUCCESS).json({
    message: MESSAGES.success,
    data: { pages },
  });
});

export const getAdminPage = asyncErrorHandler(async (req: Request, res: Response) => {
  const page = await services.getAdminPage(req.params.slug);

  return res.status(STATUS_CODES.SUCCESS).json({
    message: MESSAGES.success,
    data: page,
  });
});

export const putSection = asyncErrorHandler(async (req: Request, res: Response) => {
  const section = await services.putSection({
    slug: req.params.slug,
    key: req.params.key,
    isVisible: req.body.isVisible,
    data: req.body.data,
    rev: req.body.rev,
    actorId: req.userId as string,
  });

  return res.status(STATUS_CODES.SUCCESS).json({
    message: MESSAGES.success,
    data: { section },
  });
});

export const putSeo = asyncErrorHandler(async (req: Request, res: Response) => {
  const seo = await services.putSeo({
    slug: req.params.slug,
    data: req.body,
    actorId: req.userId as string,
  });

  return res.status(STATUS_CODES.SUCCESS).json({
    message: MESSAGES.success,
    data: { seo },
  });
});
