/**
 * SSR EJS page handlers.
 *
 * These reuse the same models / services as the JSON API so the
 * server-rendered UI and the API stay in lockstep.
 */

import { Movie } from "../models/Movie.js";
import { Review } from "../models/Review.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
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

export const home = asyncHandler(async (_req, res) => {
  const [trending, latest, topRated] = await Promise.all([
    computeTrending({ limit: 8 }),
    Movie.find().sort({ createdAt: -1 }).limit(8),
    Movie.find({ reviewCount: { $gt: 0 } })
      .sort({ averageRating: -1, reviewCount: -1 })
      .limit(8),
  ]);

  res.render("pages/home", {
    title: "FilmFusion — Discover, Rate, Discuss Films",
    trending,
    latest,
    topRated,
  });
});

export const moviesIndex = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = 18;
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

  const [movies, total, genres] = await Promise.all([
    Movie.find(filter).sort(buildSort(req.query.sort)).skip(skip).limit(limit),
    Movie.countDocuments(filter),
    Movie.distinct("genre"),
  ]);

  res.render("pages/movies", {
    title: "Browse movies",
    movies,
    genres: genres.sort(),
    filters: {
      q: req.query.q || "",
      genre: req.query.genre || "",
      year: req.query.year || "",
      minRating: req.query.minRating || "",
      sort: req.query.sort || "newest",
    },
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});

export const movieDetail = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) throw ApiError.notFound("Movie not found");

  const reviews = await Review.find({ movie: movie._id })
    .populate("author", "name avatarUrl")
    .sort({ createdAt: -1 });

  let myReview = null;
  if (req.user) {
    myReview = reviews.find((r) => r.author._id.toString() === req.user.id) || null;
  }

  res.render("pages/movie-detail", {
    title: `${movie.title} (${movie.releaseYear})`,
    movie,
    reviews,
    myReview,
  });
});

export const trendingPage = asyncHandler(async (_req, res) => {
  const movies = await computeTrending({ limit: 24 });
  res.render("pages/trending", { title: "Trending now", movies });
});

export const loginPage = (req, res) => {
  if (req.user) return res.redirect("/");
  res.render("pages/login", { title: "Sign in", error: null, form: {} });
};

export const registerPage = (req, res) => {
  if (req.user) return res.redirect("/");
  res.render("pages/register", { title: "Create account", error: null, form: {} });
};

export const profilePage = asyncHandler(async (req, res) => {
  const [reviews, ownedMovies] = await Promise.all([
    Review.find({ author: req.user.id })
      .populate("movie", "title imageUrl releaseYear")
      .sort({ createdAt: -1 }),
    Movie.find({ createdBy: req.user.id })
      .select("title imageUrl releaseYear")
      .sort({ createdAt: -1 }),
  ]);
  res.render("pages/profile", {
    title: "Your profile",
    profile: req.user,
    reviews,
    ownedMovies,
  });
});

export const subscribePage = (req, res) => {
  if (req.user.subscriptionPlan === "premium") {
    return res.redirect("/profile");
  }
  res.render("pages/subscribe", {
    title: "Go Premium",
    user: req.user,
  });
};

// ---- Admin pages ----

export const adminDashboard = asyncHandler(async (_req, res) => {
  const [userCount, movieCount, reviewCount, recentReviews, topMovies] = await Promise.all([
    User.countDocuments(),
    Movie.countDocuments(),
    Review.countDocuments(),
    Review.find()
      .populate("author", "name")
      .populate("movie", "title")
      .sort({ createdAt: -1 })
      .limit(8),
    Movie.find().sort({ averageRating: -1, reviewCount: -1 }).limit(8),
  ]);

  res.render("admin/dashboard", {
    title: "Admin dashboard",
    stats: { userCount, movieCount, reviewCount },
    recentReviews,
    topMovies,
  });
});

export const adminMovies = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = 20;
  const filter = {};
  if (req.query.q) {
    const safe = String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.title = { $regex: safe, $options: "i" };
  }
  const [movies, total] = await Promise.all([
    Movie.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Movie.countDocuments(filter),
  ]);
  res.render("admin/movies", {
    title: "Manage movies",
    movies,
    q: req.query.q || "",
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  });
});

export const adminMovieForm = asyncHandler(async (req, res) => {
  let movie = null;
  if (req.params.id) {
    movie = await Movie.findById(req.params.id);
    if (!movie) throw ApiError.notFound("Movie not found");
  }
  res.render("admin/movie-form", {
    title: movie ? `Edit ${movie.title}` : "Add movie",
    movie,
    error: null,
  });
});

export const adminCreateMovie = asyncHandler(async (req, res) => {
  try {
    const payload = {
      title: req.body.title,
      description: req.body.description,
      releaseYear: Number(req.body.releaseYear),
      genre: req.body.genre,
      director: req.body.director,
      cast: (req.body.cast || "").split(",").map((s) => s.trim()).filter(Boolean),
      durationMinutes: req.body.durationMinutes ? Number(req.body.durationMinutes) : 0,
      imageUrl: req.body.imageUrl,
      trailerUrl: req.body.trailerUrl,
      createdBy: req.user.id,
    };
    await Movie.create(payload);
    res.redirect("/admin/movies");
  } catch (err) {
    res.status(400).render("admin/movie-form", {
      title: "Add movie",
      movie: req.body,
      error: err.message,
    });
  }
});

export const adminUpdateMovie = asyncHandler(async (req, res) => {
  try {
    const update = {
      title: req.body.title,
      description: req.body.description,
      releaseYear: Number(req.body.releaseYear),
      genre: req.body.genre,
      director: req.body.director,
      cast: (req.body.cast || "").split(",").map((s) => s.trim()).filter(Boolean),
      durationMinutes: req.body.durationMinutes ? Number(req.body.durationMinutes) : 0,
      imageUrl: req.body.imageUrl,
      trailerUrl: req.body.trailerUrl,
    };
    await Movie.findByIdAndUpdate(req.params.id, update, { runValidators: true });
    res.redirect("/admin/movies");
  } catch (err) {
    res.status(400).render("admin/movie-form", {
      title: "Edit movie",
      movie: { ...req.body, _id: req.params.id },
      error: err.message,
    });
  }
});

export const adminDeleteMovie = asyncHandler(async (req, res) => {
  await Movie.findByIdAndDelete(req.params.id);
  await Review.deleteMany({ movie: req.params.id });
  res.redirect("/admin/movies");
});

export const adminUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = 25;
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
  res.render("admin/users", {
    title: "Manage users",
    users,
    q: req.query.q || "",
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  });
});
