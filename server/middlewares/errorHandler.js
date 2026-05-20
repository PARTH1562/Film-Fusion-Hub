/**
 * Global error handler.
 *
 * - JSON envelope for /api/* requests.
 * - EJS error page for everything else.
 * - Mongoose validation/cast errors are translated to 400/404 automatically.
 */

import logger from "../utils/logger.js";
import { ApiError } from "../utils/ApiError.js";

function normaliseError(err) {
  if (err?.isApiError) return err;
  if (err?.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return new ApiError(400, errors[0]?.message || "Validation failed", { errors });
  }
  if (err?.name === "CastError") return new ApiError(400, "Invalid identifier");
  if (err?.code === 11000) return new ApiError(409, "Duplicate value", { keys: err.keyValue });
  if (err?.name === "JsonWebTokenError") return new ApiError(401, "Invalid token");
  if (err?.name === "TokenExpiredError") return new ApiError(401, "Token expired");
  return new ApiError(500, err?.message || "Internal server error");
}

export default function errorHandler(err, req, res, _next) {
  const apiErr = normaliseError(err);
  if (apiErr.statusCode >= 500) logger.error("Unhandled error", err);

  const wantsJson =
    req.path.startsWith("/api") ||
    req.xhr ||
    (req.headers.accept || "").includes("application/json");

  if (wantsJson) {
    return res.status(apiErr.statusCode).json({
      success: false,
      error: { message: apiErr.message, details: apiErr.details || undefined },
    });
  }

  res.status(apiErr.statusCode).render("pages/error", {
    title: `Error ${apiErr.statusCode}`,
    status: apiErr.statusCode,
    message: apiErr.message,
    details: apiErr.details,
  });
}
