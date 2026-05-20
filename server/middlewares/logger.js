/**
 * Lightweight request logger.
 * Mirrors the format of the original server but lets the central logger
 * decide where the line ultimately goes.
 */

import logger from "../utils/logger.js";

export default function requestLogger(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    if (req.path.startsWith("/socket.io")) return;
    const ms = Date.now() - start;
    const line = `${req.method} ${req.originalUrl} ${res.statusCode} (${ms}ms)`;
    if (res.statusCode >= 500) logger.error(line);
    else if (res.statusCode >= 400) logger.warn(line);
    else logger.info(line);
  });
  next();
}
