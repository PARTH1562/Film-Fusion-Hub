/**
 * Mounts every router under their respective prefixes.
 */

import { Router } from "express";
import authRoutes from "./auth.routes.js";
import movieRoutes from "./movie.routes.js";
import reviewRoutes from "./review.routes.js";
import userRoutes from "./user.routes.js";
import pageRoutes from "./page.routes.js";
import adminRoutes from "./admin.routes.js";
import subscriptionRoutes from "./subscription.routes.js";
import premiumRoutes from "./premium.routes.js";

const router = Router();

// JSON API
router.use("/api/auth", authRoutes);
router.use("/api/movies", movieRoutes);
router.use("/api/reviews", reviewRoutes);
router.use("/api/users", userRoutes);
router.use("/api/subscriptions", subscriptionRoutes);

// Health probe
router.get("/api/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

// Admin SSR (mounted before page routes since both use HTML)
router.use("/admin", adminRoutes);

// Public SSR
router.use("/", premiumRoutes);
router.use("/", pageRoutes);

export default router;
