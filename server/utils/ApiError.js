/**
 * Domain-specific error class so the global error handler can format
 * consistent JSON / EJS error responses based on `statusCode`.
 */

export class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isApiError = true;
  }

  static badRequest(msg, details) {
    return new ApiError(400, msg || "Bad request", details);
  }
  static unauthorized(msg) {
    return new ApiError(401, msg || "Unauthorized");
  }
  static forbidden(msg) {
    return new ApiError(403, msg || "Forbidden");
  }
  static notFound(msg) {
    return new ApiError(404, msg || "Not found");
  }
  static conflict(msg) {
    return new ApiError(409, msg || "Conflict");
  }
  static internal(msg) {
    return new ApiError(500, msg || "Internal server error");
  }
}

export default ApiError;
