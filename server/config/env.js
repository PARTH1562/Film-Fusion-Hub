/**
 * Centralised environment configuration.
 * Reads from process.env, validates required vars, and exports a frozen object.
 */

import "dotenv/config";

function required(name, fallback) {
  let v = process.env[name] ?? fallback;
  if (v === undefined || v === null || v === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  // Defensive cleanup: trim whitespace, strip surrounding quotes, and strip
  // a leading "NAME=" prefix in case the secret was pasted with the var name.
  v = String(v).trim();
  if (v.startsWith(`${name}=`)) v = v.slice(name.length + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  return v;
}

export const env = Object.freeze({
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 8080),
  MONGODB_URI: required("MONGODB_URI"),
  JWT_SECRET: required("JWT_SECRET"),
  JWT_REFRESH_SECRET: required("JWT_REFRESH_SECRET"),
  JWT_ACCESS_TTL: process.env.JWT_ACCESS_TTL || "15m",
  JWT_REFRESH_TTL: process.env.JWT_REFRESH_TTL || "7d",
  SESSION_SECRET: required("SESSION_SECRET"),
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || undefined,
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || "placeholder_secret",
});

export default env;
