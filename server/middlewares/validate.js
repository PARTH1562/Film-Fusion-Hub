/**
 * Runs an array of express-validator chains and converts any errors
 * into a 400 ApiError with a structured details payload.
 */

import { validationResult } from "express-validator";
import { ApiError } from "../utils/ApiError.js";

export default function validate(chains) {
  return async (req, _res, next) => {
    for (const chain of chains) await chain.run(req);
    const result = validationResult(req);
    if (result.isEmpty()) return next();
    const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
    next(ApiError.badRequest(errors[0].message, { errors }));
  };
}
