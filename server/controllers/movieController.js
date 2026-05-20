/**
 * Movie HTTP handlers (REST API).
 */

import { Movie } from "../models/Movie.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, created, noContent } from "../utils/apiResponse.js";
import { computeTrending } from "../services/trendingService.js";

function buildSort(sort) {
  switch (sort) {
    case "oldest":
      return { releaseYear: 1, createdAt: 1 };
    case "rating":
      return { averageRating: -1, reviewCount: -1 };
    case "popular":
      return { reviewCount: -1, averageRating: -1 };
    case "title":
      return { title: 1 };
    case "newest":
    default:
      return { createdAt: -1 };
  }
}

export const list = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(60, Math.max(1, Number(req.query.limit) || 18));
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.q) {
    const safe = String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { title: { $regex: safe, $options: "i" } },
      { description: { $regex: safe, $options: "i" } },
      { director: { $regex: safe, $options: "i" } },
    ];
  }
  if (req.query.genre) filter.genre = req.query.genre;
  if (req.query.year) filter.releaseYear = Number(req.query.year);
  if (req.query.minRating) filter.averageRating = { $gte: Number(req.query.minRating) };

  const [movies, total] = await Promise.all([
    Movie.find(filter).sort(buildSort(req.query.sort)).skip(skip).limit(limit),
    Movie.countDocuments(filter),
  ]);

  return ok(
    res,
    { movies },
    { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  );
});

export const trending = asyncHandler(async (req, res) => {
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
  const movies = await computeTrending({ limit });
  return ok(res, { movies });
});

export const detail = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) throw ApiError.notFound("Movie not found");
  return ok(res, { movie });
});

export const create = asyncHandler(async (req, res) => {
  const movie = await Movie.create({ ...req.body, createdBy: req.user?.id });
  return created(res, { movie });
});

export const update = asyncHandler(async (req, res) => {
  const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!movie) throw ApiError.notFound("Movie not found");
  return ok(res, { movie });
});

export const remove = asyncHandler(async (req, res) => {
  const movie = await Movie.findByIdAndDelete(req.params.id);
  if (!movie) throw ApiError.notFound("Movie not found");
  return noContent(res);
});

export const genres = asyncHandler(async (_req, res) => {
  const list = await Movie.distinct("genre");
  return ok(res, { genres: list.sort() });
});
