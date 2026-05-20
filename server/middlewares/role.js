/**
 * Role-based authorisation middleware.
 */

import { ApiError } from "../utils/ApiError.js";

export function requireRole(...allowed) {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!allowed.includes(req.user.role)) return next(ApiError.forbidden("Insufficient permissions"));
    next();
  };
}

export const requireAdmin = requireRole("admin");
