/**
 * RefreshToken model.
 *
 * Each row stores the SHA-256 hash of a refresh token plus its expiry,
 * letting us rotate and revoke tokens server-side. The TTL index lets
 * MongoDB clean up expired tokens automatically.
 */

import mongoose from "mongoose";

const { Schema } = mongoose;

const refreshTokenSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    replacedByHash: { type: String, default: null },
    userAgent: { type: String, default: "" },
    ip: { type: String, default: "" },
  },
  { timestamps: true },
);

// MongoDB removes expired refresh tokens automatically
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);
export default RefreshToken;
