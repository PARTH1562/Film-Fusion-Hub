/**
 * Socket.io setup.
 *
 * Authenticates the connection from the access_token cookie and exposes
 * helpers (getIO, emitToMovie, emitToUser) used by services/controllers.
 */

import { Server as IOServer } from "socket.io";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import { env } from "./env.js";
import logger from "../utils/logger.js";

let io = null;

export function initSocket(httpServer) {
  io = new IOServer(httpServer, {
    cors: { origin: true, credentials: true },
    path: "/socket.io",
  });

  io.use((socket, next) => {
    try {
      const raw = socket.handshake.headers.cookie || "";
      const cookies = cookie.parse(raw);
      const token = cookies.access_token;
      if (token) {
        const payload = jwt.verify(token, env.JWT_SECRET);
        socket.user = { id: payload.sub, role: payload.role, email: payload.email };
      }
      next();
    } catch {
      next(); // Allow anonymous connections; rooms gated by socket.user check
    }
  });

  io.on("connection", (socket) => {
    if (socket.user) socket.join(`user:${socket.user.id}`);

    socket.on("join:movie", (movieId) => {
      if (typeof movieId === "string" && movieId.length < 64) {
        socket.join(`movie:${movieId}`);
      }
    });

    socket.on("leave:movie", (movieId) => {
      if (typeof movieId === "string") socket.leave(`movie:${movieId}`);
    });

    socket.on("disconnect", () => {});
  });

  logger.info("Socket.io initialised");
  return io;
}

export function getIO() {
  if (!io) throw new Error("Socket.io has not been initialised yet");
  return io;
}

export function emitToMovie(movieId, event, payload) {
  if (!io) return;
  io.to(`movie:${movieId}`).emit(event, payload);
}

export function emitToUser(userId, event, payload) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
}
