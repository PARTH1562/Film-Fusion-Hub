/**
 * /admin — SSR admin dashboard pages (HTML).
 *
 * The JSON admin endpoints live under /api/users etc.; this router only
 * renders EJS pages and accepts the form-encoded mutations from them.
 */

import { Router } from "express";
import * as page from "../controllers/pageController.js";
import { requireAuthPage } from "../middlewares/auth.js";
import { requireAdmin } from "../middlewares/role.js";

const router = Router();

router.use(requireAuthPage, requireAdmin);

router.get("/", page.adminDashboard);
router.get("/movies", page.adminMovies);
router.get("/movies/new", page.adminMovieForm);
router.post("/movies/new", page.adminCreateMovie);
router.get("/movies/:id/edit", page.adminMovieForm);
router.post("/movies/:id/edit", page.adminUpdateMovie);
router.post("/movies/:id/delete", page.adminDeleteMovie);
router.get("/users", page.adminUsers);

export default router;
