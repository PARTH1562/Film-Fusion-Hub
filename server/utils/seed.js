/**
 * Seeds the database with the bundled movies and creates a default admin
 * if one doesn't exist. Safe to run multiple times — it upserts by title.
 *
 * Usage: pnpm --filter @workspace/api-server run seed
 */

import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import path from "path";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { Movie } from "../models/Movie.js";
import { User } from "../models/User.js";
import logger from "./logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FALLBACK_POSTER = "https://images.unsplash.com/photo-1489599735734-79b4af4cab1d?auto=format&fit=crop&w=900&q=80";

function ensureDescription(raw, m) {
  const desc = (raw || "").trim();
  if (desc.length >= 5) return desc;
  return `${m.title} (${m.year}) — a ${m.genre.toLowerCase()} film. Discover community ratings and reviews on FilmFusion.`;
}

function pickGenre(genre) {
  if (Array.isArray(genre)) return genre[0] || "Drama";
  return (genre || "Drama").split(/[,/]/)[0].trim() || "Drama";
}

async function loadMovies() {
  const candidates = [
    path.resolve(__dirname, "../../movies-data.json"),
    path.resolve(process.cwd(), "movies-data.json"),
  ];
  for (const p of candidates) {
    try {
      const raw = await readFile(p, "utf8");
      const data = JSON.parse(raw);
      const items = Array.isArray(data) ? data : Array.isArray(data.movies) ? data.movies : null;
      if (items && items.length) return { items, path: p };
    } catch { /* try next */ }
  }
  throw new Error("movies-data.json not found");
}

async function seedMovies() {
  const { items, path: src } = await loadMovies();
  logger.info(`Seeding ${items.length} movies from ${src}`);

  let inserted = 0;
  let updated = 0;
  for (const raw of items) {
    const doc = {
      title: String(raw.title || "Untitled").trim(),
      releaseYear: Number(raw.year || raw.releaseYear || new Date().getFullYear()),
      genre: pickGenre(raw.genre),
      director: raw.director || "",
      cast: Array.isArray(raw.cast) ? raw.cast : [],
      durationMinutes: Number(raw.duration || raw.durationMinutes || 0) || 0,
      imageUrl: (raw.imageUrl || raw.poster || "").trim() || FALLBACK_POSTER,
      trailerUrl: raw.trailerUrl || raw.trailer || "",
      description: ensureDescription(raw.description || raw.synopsis, {
        title: raw.title,
        year: raw.year || raw.releaseYear,
        genre: pickGenre(raw.genre),
      }),
    };

    const existing = await Movie.findOne({ title: doc.title, releaseYear: doc.releaseYear });
    if (existing) {
      Object.assign(existing, doc);
      await existing.save();
      updated += 1;
    } else {
      await Movie.create(doc);
      inserted += 1;
    }
  }
  logger.info(`Movies: ${inserted} inserted, ${updated} updated`);
}

async function seedAdmin() {
  const email = "admin@filmfusion.app";
  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== "admin") {
      existing.role = "admin";
      await existing.save();
      logger.info(`Promoted ${email} to admin`);
    } else {
      logger.info(`Default admin ${email} already exists`);
    }
    return;
  }
  await User.create({
    name: "FilmFusion Admin",
    email,
    password: "admin1234",
    role: "admin",
    bio: "Default administrator account",
  });
  logger.info(`Created default admin: ${email} / admin1234 (please rotate)`);
}

async function main() {
  try {
    await connectDB();
    await seedMovies();
    await seedAdmin();
    logger.info("Seed complete");
  } catch (err) {
    logger.error("Seed failed", err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();
