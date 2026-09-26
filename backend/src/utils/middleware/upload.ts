import multer from "multer";
import { Request, Response, NextFunction } from "express";
import { EAssetFileType } from "@models/asset/interface";
import { OperationalError } from "@utils/error/errorInstances";
import { MESSAGES, STATUS_CODES } from "@src/constants";
import { asyncErrorHandler } from "@utils/asyncHandler/asyncHandler";
import {
  SVG_MAX_SIZE_BYTES,
  decodeStrictUtf8,
  detectBinaryFileType,
  validateSvgContent,
} from "@utils/helper/fileSignature";

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB (API_CONTRACT §3)

/** multer, memory storage, single field "file", 50MB cap. */
export const uploadSingleFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
}).single("file");

/**
 * Runs AFTER multer has buffered the file. Identifies the real file type by
 * magic bytes (SVG has none, so it's identified by content) — never by the
 * client-supplied mimetype/filename — and rejects anything not on the
 * allowed list (API_CONTRACT §3). Populates req.assetFile for the controller.
 */
export const detectAndValidateAssetFile = asyncErrorHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.file) {
      throw new OperationalError(STATUS_CODES.BAD_REQUEST, MESSAGES.noFileUploaded);
    }

    const { buffer, originalname, size } = req.file;

    const binary = detectBinaryFileType(buffer);
    if (binary) {
      req.assetFile = {
        buffer,
        originalName: originalname,
        mimeType: binary.mimeType,
        fileType: binary.fileType,
        fileSize: size,
      };
      return next();
    }

    // No known binary signature matched — the only other allowed type is
    // SVG, which is plain-text XML and has no magic bytes.
    const text = decodeStrictUtf8(buffer);

    if (!text || !/<svg[\s>]/i.test(text)) {
      throw new OperationalError(
        STATUS_CODES.UNSUPPORTED_MEDIA_TYPE,
        MESSAGES.unsupportedFileType
      );
    }

    if (size > SVG_MAX_SIZE_BYTES) {
      throw new OperationalError(STATUS_CODES.PAYLOAD_TOO_LARGE, MESSAGES.fileTooLarge);
    }

    const result = validateSvgContent(text);
    if (!result.valid) {
      throw new OperationalError(
        STATUS_CODES.UNPROCESSABLE,
        `${MESSAGES.invalidSvg}: ${result.reason}`
      );
    }

    req.assetFile = {
      buffer,
      originalName: originalname,
      mimeType: "image/svg+xml",
      fileType: EAssetFileType.Image,
      fileSize: size,
    };
    next();
  }
);

/** Full upload pipeline for a single `file` field: parse + validate. */
export const uploadAsset = [uploadSingleFile, detectAndValidateAssetFile];
