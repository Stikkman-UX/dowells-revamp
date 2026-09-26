import { Request, Response } from "express";
import { asyncErrorHandler } from "@utils/asyncHandler/asyncHandler";
import { MESSAGES, STATUS_CODES } from "@src/constants";
import { OperationalError } from "@utils/error/errorInstances";
import * as assetService from "./assetService";

export const uploadAsset = asyncErrorHandler(
  async (req: Request, res: Response) => {
    if (!req.assetFile) {
      throw new OperationalError(
        STATUS_CODES.BAD_REQUEST,
        MESSAGES.noFileUploaded
      );
    }

    const asset = await assetService.upload(req.assetFile);

    return res.status(STATUS_CODES.CREATED).json({
      message: MESSAGES.success,
      data: { asset },
    });
  }
);

export const replaceAsset = asyncErrorHandler(
  async (req: Request, res: Response) => {
    if (!req.assetFile) {
      throw new OperationalError(
        STATUS_CODES.BAD_REQUEST,
        MESSAGES.noFileUploaded
      );
    }

    const asset = await assetService.replace(req.params.assetId, req.assetFile);

    return res.status(STATUS_CODES.SUCCESS).json({
      message: MESSAGES.success,
      data: { asset },
    });
  }
);
