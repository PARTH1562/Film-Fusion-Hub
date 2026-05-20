/**
 * Trending feed.
 *
 * score = (averageRating * 2) + (reviewCount * 0.5) + recencyBoost
 * recencyBoost = min(reviewsInLast14Days * 1.5, 20)
 */

import { Movie } from "../models/Movie.js";
import { Review } from "../models/Review.js";

export async function computeTrending({ limit = 12 } = {}) {
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const recentByMovie = await Review.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: "$movie", recent: { $sum: 1 } } },
  ]);
  const recentMap = new Map(recentByMovie.map((r) => [r._id.toString(), r.recent]));

  const candidates = await Movie.find({ reviewCount: { $gt: 0 } })
    .sort({ averageRating: -1, reviewCount: -1 })
    .limit(Math.max(limit * 4, 50));

  const scored = candidates.map((m) => {
    const recent = recentMap.get(m._id.toString()) || 0;
    const recencyBoost = Math.min(recent * 1.5, 20);
    const score = m.averageRating * 2 + m.reviewCount * 0.5 + recencyBoost;
    const obj = m.toJSON();
    obj.recentReviews = recent;
    obj.trendingScore = Math.round(score * 100) / 100;
    return obj;
  });

  scored.sort((a, b) => b.trendingScore - a.trendingScore);
  return scored.slice(0, limit);
}
