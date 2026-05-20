/**
 * /api/auth — JSON authentication endpoints.
 */

import { Router } from "express";
import * as ctl from "../controllers/authController.js";
import validate from "../middlewares/validate.js";
import { requireAuth } from "../middlewares/auth.js";
import { registerValidator, loginValidator } from "../validators/authValidator.js";

const router = Router();

router.post("/register", validate(registerValidator), ctl.register);
router.post("/login", validate(loginValidator), ctl.login);
router.post("/refresh", ctl.refresh);
router.post("/logout", ctl.logout);
router.get("/me", requireAuth, ctl.me);

export default router;
