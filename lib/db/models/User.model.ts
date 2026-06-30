import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUserDocument extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  authProvider: "local" | "google";
  role: "vendor" | "admin";
  phone?: string;
  whatsapp?: string;
  isActive: boolean;
  isSuspended: boolean;
  suspensionReason?: string;
  businessName?: string;
  profileImage?: string;
  profileImagePublicId?: string;
  about?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(plain: string): Promise<boolean>;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, minlength: 3, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, select: false },
    googleId: { type: String, sparse: true, unique: true },
    authProvider: { type: String, enum: ["local", "google"], default: "local" },
    role: { type: String, enum: ["vendor", "admin"], default: "vendor" },
    phone: { type: String, trim: true },
    whatsapp: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    isSuspended: { type: Boolean, default: false },
    suspensionReason: { type: String },
    businessName: { type: String, trim: true },
    profileImage: { type: String },
    profileImagePublicId: { type: String },
    about: { type: String, maxlength: 1000 },
  },
  { timestamps: true }
);

UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ isSuspended: 1 });

UserSchema.methods.comparePassword = async function (plain: string): Promise<boolean> {
  if (!this.passwordHash) return false;
  return bcrypt.compare(plain, this.passwordHash);
};

const User: Model<IUserDocument> =
  mongoose.models.User ?? mongoose.model<IUserDocument>("User", UserSchema);

export default User;
