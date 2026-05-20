/**
 * MongoDB connection helper.
 * Uses Mongoose; logs connection lifecycle for visibility.
 */

import mongoose from "mongoose";
import { env } from "./env.js";
import logger from "../utils/logger.js";

mongoose.set("strictQuery", true);

export async function connectDB() {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      autoIndex: env.NODE_ENV !== "production",
      serverSelectionTimeoutMS: 15000,
    });
    logger.info(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    logger.error("MongoDB connection failed", err);
    throw err;
  }
}

mongoose.connection.on("disconnected", () => logger.warn("MongoDB disconnected"));
mongoose.connection.on("reconnected", () => logger.info("MongoDB reconnected"));
mongoose.connection.on("error", (err) => logger.error("MongoDB error", err));
