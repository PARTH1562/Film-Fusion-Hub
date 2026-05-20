/**
 * express-validator chains for movie endpoints.
 */

import { body, param, query } from "express-validator";

const yearValidator = (field) =>
  body(field)
    .isInt({ min: 1888, max: 2100 })
    .withMessage("releaseYear must be between 1888 and 2100");

export const movieCreateValidator = [
  body("title").isString().trim().isLength({ min: 1, max: 200 }).withMessage("Title is required"),
  body("description").isString().trim().isLength({ min: 5, max: 4000 }).withMessage("Description is required"),
  yearValidator("releaseYear"),
  body("genre").isString().trim().notEmpty().withMessage("Genre is required"),
  body("director").optional({ checkFalsy: true }).isString(),
  body("cast").optional().isArray().withMessage("Cast must be an array of names"),
  body("durationMinutes").optional({ checkFalsy: true }).isInt({ min: 1, max: 600 }),
  body("imageUrl").isURL().withMessage("imageUrl must be a valid URL"),
  body("trailerUrl").optional({ checkFalsy: true }).isURL(),
];

export const movieUpdateValidator = [
  param("id").isMongoId().withMessage("Invalid movie id"),
  ...movieCreateValidator.map((v) => v.optional()),
];

export const movieIdValidator = [param("id").isMongoId().withMessage("Invalid movie id")];

export const listMoviesValidator = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 60 }).toInt(),
  query("year").optional().isInt({ min: 1888, max: 2100 }).toInt(),
  query("minRating").optional().isFloat({ min: 0, max: 5 }).toFloat(),
  query("sort").optional().isIn(["newest", "oldest", "rating", "popular", "title"]),
];
