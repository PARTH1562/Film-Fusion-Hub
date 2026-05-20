/**
 * express-validator chains for review endpoints.
 */

import { body, param } from "express-validator";

export const reviewCreateValidator = [
  param("id").isMongoId().withMessage("Invalid movie id"),
  body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be 1-5"),
  body("text").isString().trim().isLength({ min: 3, max: 4000 }).withMessage("Review text is required"),
];

export const reviewUpdateValidator = [
  param("id").isMongoId().withMessage("Invalid review id"),
  body("rating").optional().isInt({ min: 1, max: 5 }),
  body("text").optional().isString().trim().isLength({ min: 3, max: 4000 }),
];

export const reviewIdValidator = [param("id").isMongoId().withMessage("Invalid review id")];
