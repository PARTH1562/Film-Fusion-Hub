/**
 * /api/reviews — JSON endpoints for editing / voting on a single review.
 */

import { Router } from "express";
import * as ctl from "../controllers/reviewController.js";
import validate from "../middlewares/validate.js";
import { requireAuth } from "../middlewares/auth.js";
import { reviewIdValidator, reviewUpdateValidator } from "../validators/reviewValidator.js";

const router = Router();

router.patch("/:id", requireAuth, validate(reviewUpdateValidator), ctl.update);
router.delete("/:id", requireAuth, validate(reviewIdValidator), ctl.remove);
router.post("/:id/upvote", requireAuth, validate(reviewIdValidator), ctl.upvote);
router.post("/:id/downvote", requireAuth, validate(reviewIdValidator), ctl.downvote);

export default router;
