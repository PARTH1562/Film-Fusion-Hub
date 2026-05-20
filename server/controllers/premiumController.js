import { Discussion } from "../models/Discussion.js";
import { Poll } from "../models/Poll.js";
import { User } from "../models/User.js";
import { Review } from "../models/Review.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Discussions
 */
export const getDiscussions = asyncHandler(async (req, res) => {
  const discussions = await Discussion.find()
    .populate("author", "name avatarUrl")
    .sort({ createdAt: -1 });
  res.render("pages/discussions", { title: "Private Discussions", discussions });
});

export const createDiscussion = asyncHandler(async (req, res) => {
  const { title, content } = req.body;
  if (req.user.subscriptionPlan !== "premium") {
    throw ApiError.forbidden("Only premium users can create discussions");
  }
  await Discussion.create({ title, content, author: req.user.id });
  res.redirect("/discussions");
});

/**
 * Polls
 */
export const getPolls = asyncHandler(async (req, res) => {
  const polls = await Poll.find().sort({ createdAt: -1 });
  res.render("pages/polls", { title: "Community Polls", polls });
});

export const votePoll = asyncHandler(async (req, res) => {
  const { pollId, optionId } = req.body;
  const poll = await Poll.findById(pollId);
  if (!poll) throw ApiError.notFound("Poll not found");

  if (poll.voters.includes(req.user.id)) {
    throw ApiError.badRequest("You have already voted in this poll");
  }

  const option = poll.options.id(optionId);
  if (!option) throw ApiError.notFound("Option not found");

  option.votes += 1;
  poll.voters.push(req.user.id);
  await poll.save();

  res.redirect("/polls");
});

/**
 * Top Reviewers Club
 */
export const getTopReviewers = asyncHandler(async (req, res) => {
  // Aggregate to find users with most reviews
  const topReviewers = await Review.aggregate([
    { $group: { _id: "$author", reviewCount: { $sum: 1 }, avgRating: { $avg: "$rating" } } },
    { $sort: { reviewCount: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "userDetails",
      },
    },
    { $unwind: "$userDetails" },
  ]);

  res.render("pages/top-reviewers", { title: "Top Reviewers Club", reviewers: topReviewers });
});
