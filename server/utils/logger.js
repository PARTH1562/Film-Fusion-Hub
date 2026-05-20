/**
 * Tiny structured logger used across the app.
 * Falls back to console under the hood so it works everywhere.
 */

const ts = () => new Date().toISOString();

function format(level, args) {
  return `[${ts()}] ${level} ${args
    .map((a) => (typeof a === "string" ? a : JSON.stringify(a, replacer)))
    .join(" ")}`;
}

function replacer(_k, v) {
  if (v instanceof Error) return { name: v.name, message: v.message, stack: v.stack };
  return v;
}

const logger = {
  info: (...args) => console.log(format("INFO", args)),
  warn: (...args) => console.warn(format("WARN", args)),
  error: (...args) => console.error(format("ERROR", args)),
  debug: (...args) => {
    if (process.env.NODE_ENV !== "production") console.log(format("DEBUG", args));
  },
};

export default logger;
