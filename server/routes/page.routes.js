/**
 * SSR page routes.
 *
 * Public-facing HTML pages rendered via EJS. The matching JSON API lives
 * under /api/*.
 */

import { Router } from "express";
import * as page from "../controllers/pageController.js";
import * as auth from "../controllers/authController.js";
import { requireAuthPage } from "../middlewares/auth.js";
import validate from "../middlewares/validate.js";
import { registerValidator, loginValidator } from "../validators/authValidator.js";

const router = Router();

router.get("/", page.home);
router.get("/movies", page.moviesIndex);
router.get("/movies/:id", page.movieDetail);
router.get("/trending", page.trendingPage);

router.get("/login", page.loginPage);
router.post("/login", validate(loginValidator), auth.loginForm);
router.get("/register", page.registerPage);
router.post("/register", validate(registerValidator), auth.registerForm);
router.post("/logout", auth.logoutForm);

router.get("/profile", requireAuthPage, page.profilePage);
router.get("/subscribe", requireAuthPage, page.subscribePage);

export default router;
