import { Request, Response, NextFunction } from "express";
import { MulterError } from "multer";
import { OperationalError, ValidationFailed } from "./errorInstances";
import { MESSAGES, STATUS_CODES } from "@src/constants";
import { logError } from "@utils/logger/logger";

const CastErrorHandler = (err: any) => {
  const message = `Invalid value: ${err.value} for field ${err.path}`;
  return new OperationalError(STATUS_CODES.BAD_REQUEST, message);
};

const MulterErrorHandler = (err: MulterError) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return new OperationalError(STATUS_CODES.PAYLOAD_TOO_LARGE, MESSAGES.fileTooLarge);
  }

  return new OperationalError(STATUS_CODES.BAD_REQUEST, err.message);
};

export const globalErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  if (error.name === "CastError") {
    error = CastErrorHandler(error);
  } else if (error instanceof MulterError) {
    error = MulterErrorHandler(error);
  }

  const statusCode = error.statusCode || STATUS_CODES.SERVER_ERROR;
  const status =
    error.status ||
    (statusCode >= 400 && statusCode < 500 ? "Failed" : "Error");
  const message = error.message || MESSAGES.serverError;

  if (statusCode >= 500) {
    logError({ message, stack: error.stack, path: req.originalUrl });
  }

  const body: Record<string, unknown> = {
    status,
    statusCode,
    message,
  };

  if (error instanceof ValidationFailed && error.errors?.length) {
    body.errors = error.errors;
  }

  if (process.env.ENVIRONMENT === "development") {
    body.stack = error.stack;
  }

  return res.status(statusCode).json(body);
};
