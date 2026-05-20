/**
 * Migration: Populate missing imageUrl for all movies.
 * Run with: node server/utils/migratePosters.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import logger from './logger.js';

dotenv.config();

// Define Movie schema inline
const movieSchema = new mongoose.Schema({
  title: String,
  imageUrl: String,
  poster: String,
  releaseYear: Number,
}, { strict: false });

const Movie = mongoose.model('Movie', movieSchema, 'movies');

// Fallback posters by genre
const POSTERS_BY_GENRE = {
  'Sci-Fi': 'https://images.unsplash.com/photo-1536440936694-ef5ff41e98a0?auto=format&fit=crop&w=500&q=60',
  'Action': 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=500&q=60',
  'Drama': 'https://images.unsplash.com/photo-1478720568477-152d9e3fb27f?auto=format&fit=crop&w=500&q=60',
  'Thriller': 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=500&q=60',
  'Crime': 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=500&q=60',
  'Romance': 'https://images.unsplash.com/photo-1489599735734-79b4af4cab1d?auto=format&fit=crop&w=500&q=60',
  'Comedy': 'https://images.unsplash.com/photo-1489599735734-79b4af4cab1d?auto=format&fit=crop&w=500&q=60',
  'Fantasy': 'https://images.unsplash.com/photo-1536440936694-ef5ff41e98a0?auto=format&fit=crop&w=500&q=60',
  'Mystery': 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=500&q=60',
  'Historical': 'https://images.unsplash.com/photo-1478720568477-152d9e3fb27f?auto=format&fit=crop&w=500&q=60',
};

const DEFAULT_POSTER = 'https://images.unsplash.com/photo-1489599735734-79b4af4cab1d?auto=format&fit=crop&w=500&q=60';

async function migrate() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not set');

    await mongoose.connect(uri, { dbName: 'filmfusion' });
    logger.info('Connected to MongoDB');

    // Find all movies with missing/empty imageUrl
    const moviesToUpdate = await Movie.find({
      $or: [
        { imageUrl: { $exists: false } },
        { imageUrl: '' },
        { imageUrl: null },
      ],
    });

    logger.info(`Found ${moviesToUpdate.length} movies with missing posters`);

    for (const movie of moviesToUpdate) {
      const posterUrl =
        movie.poster ||
        POSTERS_BY_GENRE[movie.genre] ||
        DEFAULT_POSTER;

      await Movie.updateOne(
        { _id: movie._id },
        { imageUrl: posterUrl }
      );

      logger.info(`✓ Updated: ${movie.title}`);
    }

    logger.info(`Migration complete! ${moviesToUpdate.length} movies updated.`);
    await mongoose.disconnect();
  } catch (err) {
    logger.error('Migration failed', err);
    process.exit(1);
  }
}

migrate();
