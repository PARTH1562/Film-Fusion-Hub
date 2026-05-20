/**
 * FilmFusion - Server entry point.
 *
 * Boots the HTTP server, attaches Socket.io, and connects to MongoDB.
 * Run with: `pnpm --filter @workspace/api-server run dev`
 */

import http from "http";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { initSocket } from "./config/socket.js";
import { env } from "./config/env.js";
import logger from "./utils/logger.js";

const httpServer = http.createServer(app);

// Attach Socket.io to the same HTTP server so it shares the port.
initSocket(httpServer);

async function bootstrap() {
  try {
    await connectDB();

    httpServer.listen(env.PORT, "0.0.0.0", () => {
      logger.info(`FilmFusion server listening on port ${env.PORT}`);
      logger.info(`Open your browser at: http://localhost:${env.PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
    });
  } catch (err) {
    logger.error("Failed to start server", err);
    process.exit(1);
  }
}

function shutdown(signal) {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  httpServer.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

bootstrap();
