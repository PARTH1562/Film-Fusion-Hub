import { Router } from "express";
import * as sub from "../controllers/subscriptionController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.post("/create-order", requireAuth, sub.createOrder);
router.post("/verify", requireAuth, sub.verifyPayment);

export default router;
