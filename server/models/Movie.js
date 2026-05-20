/**
 * Movie model.
 * `averageRating` and `reviewCount` are denormalised aggregates kept in
 * sync by the Review post-save hook (see models/Review.js).
 */

import mongoose from "mongoose";

const { Schema } = mongoose;

const movieSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, index: "text" },
    description: { type: String, required: true, maxlength: 4000 },
    releaseYear: { type: Number, required: true, min: 1888, max: 2100 },
    genre: { type: String, required: true, index: true },
    director: { type: String, default: "" },
    cast: { type: [String], default: [] },
    durationMinutes: { type: Number, default: 0 },
    imageUrl: { type: String, required: true },
    trailerUrl: { type: String, default: "" },
    averageRating: { type: Number, default: 0, index: true },
    reviewCount: { type: Number, default: 0, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

movieSchema.index({ genre: 1, averageRating: -1 });
movieSchema.index({ averageRating: -1, reviewCount: -1 });

movieSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject({ virtuals: true });
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  return obj;
};

export const Movie = mongoose.model("Movie", movieSchema);
export default Movie;
