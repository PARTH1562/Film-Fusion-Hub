/**
 * User profile + admin user management.
 */

import { User } from "../models/User.js";
import { Review } from "../models/Review.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, noContent } from "../utils/apiResponse.js";

export const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ["name", "bio", "avatarUrl"];
  const update = {};
  for (const key of allowed) if (req.body[key] !== undefined) update[key] = req.body[key];

  const user = await User.findByIdAndUpdate(req.user.id, update, { new: true, runValidators: true });
  if (!user) throw ApiError.notFound("User not found");
  return ok(res, { user: user.toSafeJSON() });
});

export const myReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ author: req.user.id })
    .populate("movie", "title imageUrl releaseYear")
    .sort({ createdAt: -1 });
  return ok(res, { reviews });
});

// ---- Admin ----

export const adminListUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
  const filter = {};
  if (req.query.q) {
    const safe = String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { name: { $regex: safe, $options: "i" } },
      { email: { $regex: safe, $options: "i" } },
    ];
  }
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);
  return ok(
    res,
    { users: users.map((u) => u.toSafeJSON()) },
    { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  );
});

export const adminUpdateUser = asyncHandler(async (req, res) => {
  const { role, isActive } = req.body;
  const update = {};
  if (role && ["user", "admin"].includes(role)) update.role = role;
  if (typeof isActive === "boolean") update.isActive = isActive;
  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!user) throw ApiError.notFound("User not found");
  return ok(res, { user: user.toSafeJSON() });
});

export const adminDeleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) throw ApiError.badRequest("You cannot delete your own account");
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw ApiError.notFound("User not found");
  await Review.deleteMany({ author: user._id });
  return noContent(res);
});
