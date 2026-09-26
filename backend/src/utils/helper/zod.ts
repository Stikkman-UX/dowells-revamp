import { Request, Response, NextFunction } from "express";
import { ZodTypeAny } from "zod";
import { ValidationFailed, ValidationIssue } from "@utils/error/errorInstances";
import { MESSAGES, STATUS_CODES } from "@src/constants";

export type RequestValidationSchema = {
  params?: ZodTypeAny;
  query?: ZodTypeAny;
  body?: ZodTypeAny;
};

type Source = keyof RequestValidationSchema;

const SOURCES: Source[] = ["params", "query", "body"];

/**
 * Validates params/query/body against the given zod schemas and, on failure,
 * throws a ValidationFailed carrying EVERY issue (across all three sources)
 * with a dotted path relative to the validated value (per API_CONTRACT §1).
 * On success the request's params/query/body are replaced with the parsed
 * (and therefore coerced/defaulted) values.
 */
export const validate =
  (schema: RequestValidationSchema) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const issues: ValidationIssue[] = [];
    const parsed: Partial<Record<Source, unknown>> = {};

    for (const source of SOURCES) {
      const fieldSchema = schema[source];
      if (!fieldSchema) continue;

      const result = fieldSchema.safeParse(req[source]);

      if (!result.success) {
        for (const issue of result.error.issues) {
          const path = issue.path.length
            ? issue.path.map(String).join(".")
            : source;

          issues.push({ path, message: issue.message });
        }
        continue;
      }

      parsed[source] = result.data;
    }

    if (issues.length) {
      return next(
        new ValidationFailed(
          STATUS_CODES.VALIDATION_FAILED,
          MESSAGES.validationFailed,
          issues
        )
      );
    }

    if (parsed.params) req.params = parsed.params as typeof req.params;
    if (parsed.query) req.query = parsed.query as typeof req.query;
    if (parsed.body) req.body = parsed.body;

    next();
  };
