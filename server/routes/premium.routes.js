import { Router } from "express";
import * as premium from "../controllers/premiumController.js";
import { requireAuthPage, requireAuth } from "../middlewares/auth.js";

const router = Router();

// Middleware to check for premium status for SSR pages
const requirePremium = (req, res, next) => {
  if (req.user.subscriptionPlan !== "premium") {
    return res.redirect("/subscribe");
  }
  next();
};

router.get("/discussions", requireAuthPage, requirePremium, premium.getDiscussions);
router.post("/discussions", requireAuth, requirePremium, premium.createDiscussion);

router.get("/polls", requireAuthPage, requirePremium, premium.getPolls);
router.post("/polls/vote", requireAuth, requirePremium, premium.votePoll);

router.get("/top-reviewers", requireAuthPage, requirePremium, premium.getTopReviewers);

export default router;
