import mongoose, { Schema, Document, Model } from "mongoose";

// Used only for the legacy Express auth flow; NextAuth v5 manages its own sessions.
// Keeping this model so the existing DB data isn't orphaned and can be cleaned up.
export interface IRefreshTokenDocument extends Document {
  userId: mongoose.Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  isRevoked: boolean;
  userAgent?: string;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RefreshTokenSchema = new Schema<IRefreshTokenDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    isRevoked: { type: Boolean, default: false, index: true },
    userAgent: { type: String },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

RefreshTokenSchema.index({ userId: 1, isRevoked: 1 });
// TTL index — MongoDB auto-deletes expired tokens
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RefreshToken: Model<IRefreshTokenDocument> =
  mongoose.models.RefreshToken ??
  mongoose.model<IRefreshTokenDocument>("RefreshToken", RefreshTokenSchema);

export default RefreshToken;
