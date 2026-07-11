/**
 * One-time script to create the platform admin account.
 * Usage:  npx tsx scripts/seed-admin.ts
 */
import mongoose from "mongoose";
import * as dotenv from "dotenv";
import path from "path";
import bcrypt from "bcryptjs";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const ADMIN_EMAIL = "admin@bookmyfarmhouse.app";
const ADMIN_PASSWORD = "Admin@BmF2024!";

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, lowercase: true },
    passwordHash: { type: String, select: false },
    role: { type: String, default: "admin" },
    authProvider: { type: String, default: "local" },
    isActive: { type: Boolean, default: true },
    isSuspended: { type: Boolean, default: false },
    subscriptionPlan: { type: String, default: "pro" },
    monthlyLeadRevealCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error("MONGODB_URI not set"); process.exit(1); }

  await mongoose.connect(uri);
  const User = mongoose.models.User ?? mongoose.model("User", UserSchema);

  const existing = await User.findOne({ email: ADMIN_EMAIL }).select("+passwordHash");
  if (existing) {
    console.log("Admin already exists:", ADMIN_EMAIL);
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const admin = await User.create({
    name: "BookMyFarmhouse Admin",
    email: ADMIN_EMAIL,
    passwordHash,
    role: "admin",
    authProvider: "local",
    isActive: true,
    isSuspended: false,
    subscriptionPlan: "pro",
    monthlyLeadRevealCount: 0,
  });

  console.log("✅ Admin created");
  console.log(`   Email   : ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log(`   _id     : ${admin._id}`);

  await mongoose.disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });
