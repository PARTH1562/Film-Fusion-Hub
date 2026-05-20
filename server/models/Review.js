/**
 * Review model.
 *
 * - One review per (movie, user) pair (compound unique index).
 * - Tracks separate upvote / downvote arrays of user IDs so we can
 *   compute totals atomically and prevent duplicate votes.
 * - A post-save hook recomputes the parent movie's averageRating and
 *   reviewCount so reads stay cheap.
 */

import mongoose from "mongoose";

const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    movie: { type: Schema.Types.ObjectId, ref: "Movie", required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, required: true, minlength: 3, maxlength: 4000 },
    upvotes: { type: [Schema.Types.ObjectId], default: [] },
    downvotes: { type: [Schema.Types.ObjectId], default: [] },
    sentimentScore: { type: Number, default: 0 },
    sentimentLabel: { type: String, enum: ["positive", "neutral", "negative"], default: "neutral" },
  },
  { timestamps: true },
);

reviewSchema.index({ movie: 1, author: 1 }, { unique: true });
reviewSchema.index({ movie: 1, createdAt: -1 });

reviewSchema.virtual("upvoteCount").get(function () {
  return this.upvotes?.length || 0;
});
reviewSchema.virtual("downvoteCount").get(function () {
  return this.downvotes?.length || 0;
});
reviewSchema.virtual("score").get(function () {
  return (this.upvotes?.length || 0) - (this.downvotes?.length || 0);
});

reviewSchema.set("toJSON", {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

async function recomputeMovieAggregates(movieId) {
  if (!movieId) return;
  const Review = mongoose.model("Review");
  const Movie = mongoose.model("Movie");
  const stats = await Review.aggregate([
    { $match: { movie: new mongoose.Types.ObjectId(String(movieId)) } },
    { $group: { _id: "$movie", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  const { avg = 0, count = 0 } = stats[0] || {};
  await Movie.findByIdAndUpdate(movieId, {
    averageRating: Math.round(avg * 10) / 10,
    reviewCount: count,
  });
}

reviewSchema.post("save", async function postSave(doc) {
  await recomputeMovieAggregates(doc.movie);
});

reviewSchema.post("findOneAndDelete", async function postDelete(doc) {
  if (doc) await recomputeMovieAggregates(doc.movie);
});

reviewSchema.post("deleteOne", { document: true, query: false }, async function postDeleteDoc() {
  await recomputeMovieAggregates(this.movie);
});

export const Review = mongoose.model("Review", reviewSchema);
export default Review;
