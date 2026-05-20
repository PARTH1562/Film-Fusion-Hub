/**
 * User model. Passwords are hashed with bcrypt before save.
 * `role` controls authorisation (user | admin).
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      index: true,
    },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ["user", "admin"], default: "user", index: true },
    avatarUrl: { type: String, default: null },
    bio: { type: String, default: "", maxlength: 280 },
    isActive: { type: Boolean, default: true },
    subscriptionPlan: { type: String, enum: ["free", "premium"], default: "free", index: true },
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.password;
        return ret;
      },
    },
  },
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function comparePassword(plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    role: this.role,
    avatarUrl: this.avatarUrl,
    bio: this.bio,
    subscriptionPlan: this.subscriptionPlan,
    createdAt: this.createdAt,
  };
};

export const User = mongoose.model("User", userSchema);
export default User;
