import type { ApiErrorEnvelope } from "@/types/cms";

/**
 * Thrown by the authenticated API clients (`serverApiFetch`, the browser
 * client) whenever the backend responds with a non-2xx status. Carries the
 * HTTP status and, on 422, the per-field validation issues from the
 * contract's error envelope.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly errors?: { path: string; message: string }[];

  constructor(status: number, message: string, errors?: ApiErrorEnvelope["errors"]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

export async function parseErrorEnvelope(res: Response): Promise<ApiError> {
  try {
    const body = (await res.json()) as Partial<ApiErrorEnvelope>;
    return new ApiError(
      res.status,
      body.message ?? `Request failed with status ${res.status}`,
      body.errors
    );
  } catch {
    return new ApiError(res.status, `Request failed with status ${res.status}`);
  }
}
