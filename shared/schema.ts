import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const movies = pgTable("movies", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  releaseYear: integer("release_year").notNull(),
  genre: text("genre").notNull(),
  imageUrl: text("image_url").notNull(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  movieId: integer("movie_id").notNull(),
  rating: integer("rating").notNull(),
  reviewText: text("review_text").notNull(),
  authorName: text("author_name").notNull(),
});

export const insertMovieSchema = createInsertSchema(movies).omit({ id: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true }).extend({
  rating: z.number().min(1).max(5),
  movieId: z.number()
});

export type Movie = typeof movies.$inferSelect;
export type InsertMovie = z.infer<typeof insertMovieSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type MovieWithRating = Movie & { averageRating: number; reviewCount: number };
