/**
 * 404 handler. Responds with JSON for /api routes and an EJS page otherwise.
 */

import { ApiError } from "../utils/ApiError.js";

export default function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}
