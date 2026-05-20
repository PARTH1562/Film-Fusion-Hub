/**
 * Authentication middlewares.
 *
 * `attachUser`     — runs on every request, decodes the access_token cookie
 *                    or Authorization: Bearer header and attaches req.user.
 * `requireAuth`    — JSON 401 if no user is present.
 * `requireAuthPage`— Redirect to /login (with ?next=) for SSR pages.
 */

import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";

function readToken(req) {
  const auth = req.headers.authorization || "";
  if (auth.startsWith("Bearer ")) return auth.slice(7);
  if (req.cookies?.access_token) return req.cookies.access_token;
  return null;
}

export async function attachUser(req, _res, next) {
  try {
    const token = readToken(req);
    if (token) {
      try {
        const payload = jwt.verify(token, env.JWT_SECRET);
        const user = await User.findById(payload.sub);
        if (user && user.isActive) {
          req.user = user.toSafeJSON();
          return next();
        }
      } catch {
        // expired / invalid — fall through to session
      }
    }
    if (req.session?.userId) {
      const user = await User.findById(req.session.userId);
      if (user && user.isActive) req.user = user.toSafeJSON();
    }
    next();
  } catch (err) {
    next(err);
  }
}

export function requireAuth(req, _res, next) {
  if (!req.user) return next(ApiError.unauthorized("Authentication required"));
  next();
}

export function requireAuthPage(req, res, next) {
  if (req.user) return next();
  const next_ = encodeURIComponent(req.originalUrl);
  return res.redirect(`/login?next=${next_}`);
}
