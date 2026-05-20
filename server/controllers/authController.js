/**
 * Auth HTTP handlers.
 *
 * Two flavours per action: JSON (for /api/auth) and form (for /login,
 * /register POSTs that come from the EJS pages).
 */

import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, created } from "../utils/apiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import * as authService from "../services/authService.js";
import {
  issueTokensForUser,
  rotateRefreshToken,
  revokeRefreshToken,
  setAuthCookies,
  clearAuthCookies,
  COOKIE_NAMES,
} from "../services/tokenService.js";

// -------------------- JSON API --------------------

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const user = await authService.registerUser({ name, email, password });
  // We no longer auto-login. User must call /login API.
  return created(res, { user: user.toSafeJSON(), message: "Account created. Please sign in." });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.authenticate({ email, password });
  const tokens = await issueTokensForUser(user, { req });
  setAuthCookies(res, tokens);
  if (req.session) req.session.userId = user._id.toString();
  return ok(res, { user: user.toSafeJSON(), ...tokens });
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[COOKIE_NAMES.REFRESH] || req.body?.refreshToken;
  if (!refreshToken) throw ApiError.unauthorized("No refresh token provided");

  let payload;
  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
  } catch {
    throw ApiError.unauthorized("Invalid refresh token");
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) throw ApiError.unauthorized("User not found");

  const tokens = await rotateRefreshToken(refreshToken, user, { req });
  setAuthCookies(res, tokens);
  return ok(res, { user: user.toSafeJSON(), ...tokens });
});

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[COOKIE_NAMES.REFRESH];
  await revokeRefreshToken(refreshToken);
  clearAuthCookies(res);
  if (req.session) req.session.destroy(() => {});
  return ok(res, { loggedOut: true });
});

export const me = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized();
  return ok(res, { user: req.user });
});

// -------------------- Form (EJS) flows --------------------

export const loginForm = asyncHandler(async (req, res) => {
  try {
    const user = await authService.authenticate({ email: req.body.email, password: req.body.password });
    const tokens = await issueTokensForUser(user, { req });
    setAuthCookies(res, tokens);
    if (req.session) req.session.userId = user._id.toString();
    const next = typeof req.query.next === "string" ? req.query.next : "/";
    return res.redirect(next);
  } catch (err) {
    return res.status(401).render("pages/login", {
      title: "Sign in",
      error: err.message,
      form: { email: req.body.email },
    });
  }
});

export const registerForm = asyncHandler(async (req, res) => {
  try {
    await authService.registerUser({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
    });
    // Set a flash message for the login page
    if (req.session) {
      req.session.flash = { type: "success", message: "Account created successfully! Please sign in to continue." };
    }
    return res.redirect("/login");
  } catch (err) {
    return res.status(err.statusCode || 400).render("pages/register", {
      title: "Create account",
      error: err.message,
      form: { name: req.body.name, email: req.body.email },
    });
  }
});

export const logoutForm = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[COOKIE_NAMES.REFRESH];
  await revokeRefreshToken(refreshToken);
  clearAuthCookies(res);
  if (req.session) req.session.destroy(() => {});
  return res.redirect("/");
});
