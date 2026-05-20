/**
 * Seeds random reviews for a few movies to make the community feel alive.
 */

import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { Movie } from "../models/Movie.js";
import { User } from "../models/User.js";
import { Review } from "../models/Review.js";
import Sentiment from "sentiment";
import logger from "./logger.js";

const sentiment = new Sentiment();

const SAMPLE_REVIEWS = [
  { rating: 5, text: "Absolutely masterpiece! The cinematography was out of this world." },
  { rating: 4, text: "Great story and even better acting. Highly recommend it." },
  { rating: 5, text: "One of the best films I've seen this year. Pure cinema." },
  { rating: 3, text: "It was okay, but the middle part felt a bit slow for me." },
  { rating: 2, text: "I didn't quite get the hype. The plot was a bit confusing." },
  { rating: 4, text: "A visually stunning experience. The director really knows his craft." },
  { rating: 5, text: "Emotional rollercoaster. Bring tissues!" },
  { rating: 1, text: "Total waste of time. I expected much more from the cast." },
];

function analyze(text) {
  const result = sentiment.analyze(text);
  let label = "neutral";
  if (result.score > 1) label = "positive";
  else if (result.score < -1) label = "negative";
  return { score: result.score, label };
}

async function main() {
  try {
    await connectDB();
    
    const movies = await Movie.find();
    const users = await User.find().limit(10);
    
    if (movies.length === 0 || users.length === 0) {
      logger.warn("Need movies and users to seed reviews. Run 'npm run seed' first.");
      return;
    }

    let count = 0;
    for (const movie of movies) {
      // Pick 2-3 random users for each movie
      const reviewers = users.sort(() => 0.5 - Math.random()).slice(0, Math.min(3, users.length));
      
      for (const user of reviewers) {
        // Check if review already exists
        const existing = await Review.findOne({ movie: movie._id, author: user._id });
        if (existing) continue;

        const sample = SAMPLE_REVIEWS[Math.floor(Math.random() * SAMPLE_REVIEWS.length)];
        const { score, label } = analyze(sample.text);

        await Review.create({
          movie: movie._id,
          author: user._id,
          rating: sample.rating,
          text: sample.text,
          sentimentScore: score,
          sentimentLabel: label,
        });
        count++;
      }
    }

    logger.info(`Successfully seeded ${count} reviews across ${movies.length} movies.`);
  } catch (err) {
    logger.error("Seed reviews failed", err);
  } finally {
    await mongoose.disconnect();
  }
}

main();
