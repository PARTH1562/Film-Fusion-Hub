/**
 * /api/movies — JSON movie endpoints.
 */

import { Router } from "express";
import * as ctl from "../controllers/movieController.js";
import * as reviews from "../controllers/reviewController.js";
import validate from "../middlewares/validate.js";
import { requireAuth } from "../middlewares/auth.js";
import { requireAdmin } from "../middlewares/role.js";
import {
  movieCreateValidator,
  movieUpdateValidator,
  movieIdValidator,
  listMoviesValidator,
} from "../validators/movieValidator.js";
import { reviewCreateValidator } from "../validators/reviewValidator.js";

const router = Router();

router.get("/", validate(listMoviesValidator), ctl.list);
router.get("/trending", ctl.trending);
router.get("/genres", ctl.genres);
router.get("/:id", validate(movieIdValidator), ctl.detail);

router.post("/", requireAuth, requireAdmin, validate(movieCreateValidator), ctl.create);
router.patch("/:id", requireAuth, requireAdmin, validate(movieUpdateValidator), ctl.update);
router.delete("/:id", requireAuth, requireAdmin, validate(movieIdValidator), ctl.remove);

// Nested reviews
router.get("/:id/reviews", validate(movieIdValidator), reviews.listForMovie);
router.post(
  "/:id/reviews",
  requireAuth,
  validate(reviewCreateValidator),
  reviews.createForMovie,
);

export default router;
