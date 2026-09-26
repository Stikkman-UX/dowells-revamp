export class OperationalError extends Error {
  public statusCode: number;
  public message: string;
  public status: string;

  constructor(statusCode: number = 500, message: string = "Server error") {
    super(message);

    //  This is a fix for incorrect instanceOf
    Object.setPrototypeOf(this, OperationalError.prototype);
    Error.captureStackTrace(this, this.constructor);

    this.statusCode = statusCode;
    this.message = message;
    this.status = statusCode >= 400 && statusCode < 500 ? "Failed" : "Error";
  }
}

export class RouteNotFound extends Error {
  public statusCode: number = 404;
  public message: string;
  public status: string;

  constructor(message: string) {
    super(message);

    //  This is a fix for incorrect instanceOf
    Object.setPrototypeOf(this, RouteNotFound.prototype);
    Error.captureStackTrace(this, this.constructor);

    this.status = "Failed";
    this.name = this.constructor.name;
    this.message = message;
  }
}

export type ValidationIssue = { path: string; message: string };

export class ValidationFailed extends Error {
  public statusCode: number;
  public status: string;
  public errors: ValidationIssue[];

  constructor(
    statusCode: number = 422,
    message: string = "Validation Failed, Kindly check your parameters",
    errors: ValidationIssue[] = []
  ) {
    super(message);

    Object.setPrototypeOf(this, ValidationFailed.prototype);
    Error.captureStackTrace(this, this.constructor);

    this.message = message;
    this.statusCode = statusCode;
    this.status = "Failed";
    this.name = this.constructor.name;
    this.errors = errors;
  }
}
