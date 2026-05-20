/**
 * express-validator chains for auth requests.
 */

import { body } from "express-validator";

export const registerValidator = [
  body("name").isString().trim().isLength({ min: 2, max: 60 }).withMessage("Name must be 2-60 characters"),
  body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("password")
    .isString()
    .isLength({ min: 8, max: 200 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Za-z]/)
    .withMessage("Password must contain a letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain a number"),
];

export const loginValidator = [
  body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("password").isString().isLength({ min: 8, max: 200 }).withMessage("Password is required"),
];
