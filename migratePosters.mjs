import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const movieSchema = new mongoose.Schema({
  title: String,
  imageUrl: String,
  poster: String,
  releaseYear: Number,
  genre: String,
}, { strict: false });

const Movie = mongoose.model('Movie', movieSchema, 'movies');

const POSTERS_BY_GENRE = {
  'Sci-Fi': 'https://images.unsplash.com/photo-1536440936694-ef5ff41e98a0?auto=format&fit=crop&w=500&q=60',
  'Action': 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=500&q=60',
  'Drama': 'https://images.unsplash.com/photo-1478720568477-152d9e3fb27f?auto=format&fit=crop&w=500&q=60',
  'Thriller': 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=500&q=60',
  'Crime': 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=500&q=60',
  'Comedy': 'https://images.unsplash.com/photo-1489599735734-79b4af4cab1d?auto=format&fit=crop&w=500&q=60',
  'Fantasy': 'https://images.unsplash.com/photo-1536440936694-ef5ff41e98a0?auto=format&fit=crop&w=500&q=60',
  'Romance': 'https://images.unsplash.com/photo-1489599735734-79b4af4cab1d?auto=format&fit=crop&w=500&q=60',
  'Mystery': 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=500&q=60',
  'Historical': 'https://images.unsplash.com/photo-1478720568477-152d9e3fb27f?auto=format&fit=crop&w=500&q=60',
};

const DEFAULT_POSTER = 'https://images.unsplash.com/photo-1489599735734-79b4af4cab1d?auto=format&fit=crop&w=500&q=60';

async function migrate() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.log('MONGODB_URI not found');
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log('✓ Connected to MongoDB');

    const moviesToUpdate = await Movie.find({
      $or: [
        { imageUrl: { $exists: false } },
        { imageUrl: '' },
        { imageUrl: null },
      ],
    });

    console.log(`Found ${moviesToUpdate.length} movies with missing posters`);

    let updated = 0;
    for (const movie of moviesToUpdate) {
      const posterUrl = movie.poster || POSTERS_BY_GENRE[movie.genre] || DEFAULT_POSTER;
      await Movie.updateOne({ _id: movie._id }, { imageUrl: posterUrl });
      console.log(`✓ ${movie.title}`);
      updated++;
    }

    console.log(`\n✓ Complete! ${updated} movies updated.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

migrate();
