export const MESSAGES = {
  ok: "Ok",
  success: "Success.",
  validationFailed: "Validation Failed, Kindly check your parameters",
  not_allowed: "You're not allowed",
  userNotFound: "User not found",
  serverError: "Something went wrong, Please try again.",
  routeNotFound: "Route not found.",
  notFound: "Not Found",
  badRequest: "Bad request",
  authSessionExpired: "Your session has expired, kindly login again",
  invalidToken: "Invalid token, Token expired",

  // auth
  invalidCredentials: "Invalid email or password",
  notAuthenticated: "You must be logged in to perform this action",
  csrfFailed: "Request blocked for security reasons",
  tooManyRequests: "Too many attempts. Please try again later.",

  // assets
  assetNotFound: "Asset not found",
  unsupportedFileType: "Unsupported file type",
  fileTooLarge: "File is too large",
  invalidSvg: "SVG file failed validation",
  noFileUploaded: "No file was uploaded",

  // pages
  pageNotFound: "Page not found",
  sectionNotFound: "Section not found",
  staleRevision: "This section was changed by someone else. Please reload and try again.",
  seoNotAvailable: "SEO is not available for this page",
  iconMustBeSvg: "Icon must be an SVG image (image/svg+xml)",
  posterRequired: "A poster image is required when media is a video, and must be an image",
  ogImageMustBeImage: "ogImage must be an image, and cannot be an SVG",
  fileMustBeDocument: "file must be a document (application/pdf)",
  documentNotAllowed: "A document (PDF) is only allowed in a field named \"file\"",

  // products (categories + products, API_CONTRACT §6)
  categoryNotFound: "Category not found",
  productNotFound: "Product not found",
  slugConflict: "This slug is already in use",
  categoryHasProducts: "This category still has products and cannot be deleted",
  reorderIdsMismatch: "ids must be exactly the current set of items, in the new order",
  invalidObjectId: "must be a valid id",
  categoryRequired: "Category not found",
};

export const STATUS_CODES = {
  SUCCESS: 200,
  CREATED: 201,
  ACTION_PENDING: 202,
  ACTION_COMPLETE: 204,

  BAD_REQUEST: 400,
  ACTION_FAILED: 400,
  AUTH_FAILED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  VALIDATION_FAILED: 422,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,

  SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
};
