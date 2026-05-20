/**
 * Authentication business logic.
 * Controllers stay thin and delegate password / token mechanics here.
 */

import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";

export async function registerUser({ name, email, password }) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw ApiError.conflict("An account with that email already exists");

  const user = new User({ name, email, password });
  await user.save();
  return user;
}

export async function authenticate({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user || !user.isActive) throw ApiError.unauthorized("Invalid email or password");

  const ok = await user.comparePassword(password);
  if (!ok) throw ApiError.unauthorized("Invalid email or password");

  user.password = undefined; // never expose
  return user;
}

export async function findUserById(id) {
  return User.findById(id);
}
