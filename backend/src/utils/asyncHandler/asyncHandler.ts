import { Request, Response, NextFunction } from "express";

// Async handler to avoid repetitive try-catch in each function
export const asyncErrorHandler = (fn: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error: any) => next(error));
  };
};
