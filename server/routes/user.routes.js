/**
 * /api/users — profile + admin user management.
 */

import { Router } from "express";
import * as ctl from "../controllers/userController.js";
import { requireAuth } from "../middlewares/auth.js";
import { requireAdmin } from "../middlewares/role.js";
import validate from "../middlewares/validate.js";
import { param } from "express-validator";

const router = Router();

router.patch("/me", requireAuth, ctl.updateProfile);
router.get("/me/reviews", requireAuth, ctl.myReviews);

router.get("/", requireAuth, requireAdmin, ctl.adminListUsers);
router.patch(
  "/:id",
  requireAuth,
  requireAdmin,
  validate([param("id").isMongoId()]),
  ctl.adminUpdateUser,
);
router.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  validate([param("id").isMongoId()]),
  ctl.adminDeleteUser,
);

export default router;
