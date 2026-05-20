/**
 * Review HTTP handlers.
 *
 * Each create / update / delete / vote also emits a Socket.io event so
 * connected clients can update the movie page in real time.
 */

import mongoose from "mongoose";
import { Review } from "../models/Review.js";
import { Movie } from "../models/Movie.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, created, noContent } from "../utils/apiResponse.js";
import { emitToMovie } from "../config/socket.js";
import Sentiment from "sentiment";

const sentiment = new Sentiment();

function analyzeSentiment(text) {
  const result = sentiment.analyze(text);
  let label = "neutral";
  if (result.score > 1) label = "positive";
  else if (result.score < -1) label = "negative";
  return { score: result.score, label };
}

async function loadPopulated(id) {
  return Review.findById(id).populate("author", "name avatarUrl");
}

export const listForMovie = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const skip = (page - 1) * limit;

  const filter = { movie: req.params.id };
  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate("author", "name avatarUrl")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter),
  ]);

  return ok(
    res,
    { reviews },
    { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  );
});

export const createForMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) throw ApiError.notFound("Movie not found");

  try {
    const { score, label } = analyzeSentiment(req.body.text);
    const review = await Review.create({
      movie: movie._id,
      author: req.user.id,
      rating: req.body.rating,
      text: req.body.text,
      sentimentScore: score,
      sentimentLabel: label,
    });
    const populated = await loadPopulated(review._id);
    emitToMovie(movie._id.toString(), "review:created", { review: populated });
    return created(res, { review: populated });
  } catch (err) {
    if (err.code === 11000) throw ApiError.conflict("You have already reviewed this movie");
    throw err;
  }
});

export const update = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound("Review not found");

  const isOwner = review.author.toString() === req.user.id;
  if (!isOwner && req.user.role !== "admin") throw ApiError.forbidden();

  if (req.body.rating !== undefined) review.rating = req.body.rating;
  if (req.body.text !== undefined) {
    review.text = req.body.text;
    const { score, label } = analyzeSentiment(req.body.text);
    review.sentimentScore = score;
    review.sentimentLabel = label;
  }
  await review.save();

  const populated = await loadPopulated(review._id);
  emitToMovie(review.movie.toString(), "review:updated", { review: populated });
  return ok(res, { review: populated });
});

export const remove = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound("Review not found");

  const isOwner = review.author.toString() === req.user.id;
  if (!isOwner && req.user.role !== "admin") throw ApiError.forbidden();

  const movieId = review.movie.toString();
  await review.deleteOne();
  emitToMovie(movieId, "review:deleted", { id: review._id.toString() });
  return noContent(res);
});

async function castVote(reviewId, userId, type) {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const inverse = type === "up" ? "downvotes" : "upvotes";
  const same = type === "up" ? "upvotes" : "downvotes";

  const existing = await Review.findById(reviewId);
  if (!existing) throw ApiError.notFound("Review not found");

  const alreadySame = existing[same].some((id) => id.toString() === userId);
  const update = alreadySame
    ? { $pull: { [same]: userObjectId } }
    : { $pull: { [inverse]: userObjectId }, $addToSet: { [same]: userObjectId } };

  const updated = await Review.findByIdAndUpdate(reviewId, update, { new: true }).populate(
    "author",
    "name avatarUrl",
  );
  emitToMovie(updated.movie.toString(), "review:voted", { review: updated });
  return updated;
}

export const upvote = asyncHandler(async (req, res) => {
  const review = await castVote(req.params.id, req.user.id, "up");
  return ok(res, { review });
});

export const downvote = asyncHandler(async (req, res) => {
  const review = await castVote(req.params.id, req.user.id, "down");
  return ok(res, { review });
});
