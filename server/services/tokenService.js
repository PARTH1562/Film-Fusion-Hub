/**
 * JWT issuance + refresh-token persistence.
 *
 * Access tokens are short-lived JWTs (15m). Refresh tokens are longer-lived
 * JWTs (7d) but the SHA-256 hash is also persisted so we can rotate /
 * revoke them server-side.
 */

import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { RefreshToken } from "../models/RefreshToken.js";

const ACCESS_COOKIE = "access_token";
const REFRESH_COOKIE = "refresh_token";

function ttlToMs(ttl) {
  const m = String(ttl).match(/^(\d+)([smhd])?$/);
  if (!m) return 15 * 60 * 1000;
  const n = Number(m[1]);
  const unit = m[2] || "s";
  return n * { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit];
}

function hash(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, email: user.email },
    env.JWT_SECRET,
    { expiresIn: env.JWT_ACCESS_TTL },
  );
}

export function signRefreshToken(user) {
  return jwt.sign({ sub: user._id.toString(), type: "refresh" }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_TTL,
  });
}

export async function issueTokensForUser(user, { req } = {}) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  const expiresAt = new Date(Date.now() + ttlToMs(env.JWT_REFRESH_TTL));

  await RefreshToken.create({
    user: user._id,
    tokenHash: hash(refreshToken),
    expiresAt,
    userAgent: req?.headers?.["user-agent"] || "",
    ip: req?.ip || "",
  });

  return { accessToken, refreshToken };
}

export async function rotateRefreshToken(oldToken, user, { req } = {}) {
  const oldHash = hash(oldToken);
  const stored = await RefreshToken.findOne({ tokenHash: oldHash, revokedAt: null });
  if (!stored) throw new Error("Refresh token reuse detected or revoked");

  const newRefresh = signRefreshToken(user);
  const newHash = hash(newRefresh);
  const expiresAt = new Date(Date.now() + ttlToMs(env.JWT_REFRESH_TTL));

  stored.revokedAt = new Date();
  stored.replacedByHash = newHash;
  await stored.save();

  await RefreshToken.create({
    user: user._id,
    tokenHash: newHash,
    expiresAt,
    userAgent: req?.headers?.["user-agent"] || "",
    ip: req?.ip || "",
  });

  return { accessToken: signAccessToken(user), refreshToken: newRefresh };
}

export async function revokeRefreshToken(token) {
  if (!token) return;
  await RefreshToken.findOneAndUpdate(
    { tokenHash: hash(token), revokedAt: null },
    { revokedAt: new Date() },
  );
}

export function setAuthCookies(res, { accessToken, refreshToken }) {
  const secure = env.NODE_ENV === "production";
  res.cookie(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    maxAge: ttlToMs(env.JWT_ACCESS_TTL),
    path: "/",
  });
  res.cookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    maxAge: ttlToMs(env.JWT_REFRESH_TTL),
    path: "/",
  });
}

export function clearAuthCookies(res) {
  res.clearCookie(ACCESS_COOKIE, { path: "/" });
  res.clearCookie(REFRESH_COOKIE, { path: "/" });
}

export const COOKIE_NAMES = { ACCESS: ACCESS_COOKIE, REFRESH: REFRESH_COOKIE };
