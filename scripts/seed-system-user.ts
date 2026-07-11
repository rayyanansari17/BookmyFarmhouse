/**
 * Run once to create the BookMyFarmhouse System user.
 * Copy the printed _id into .env.local as SYSTEM_USER_ID.
 *
 * Usage:
 *   npx tsx scripts/seed-system-user.ts
 */
import mongoose from "mongoose";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const SYSTEM_EMAIL = "system@bookmyfarmhouse.app";

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, lowercase: true },
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
  if (!uri) {
    console.error("MONGODB_URI not set in .env.local");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const User = mongoose.models.User ?? mongoose.model("User", UserSchema);

  let user = await User.findOne({ email: SYSTEM_EMAIL });

  if (user) {
    console.log("System user already exists:");
  } else {
    user = await User.create({
      name: "BookMyFarmhouse",
      email: SYSTEM_EMAIL,
      role: "admin",
      authProvider: "local",
      isActive: true,
      isSuspended: false,
      subscriptionPlan: "pro",
      monthlyLeadRevealCount: 0,
    });
    console.log("System user created:");
  }

  console.log(`  _id : ${user._id}`);
  console.log(`  email: ${user.email}`);
  console.log("");
  console.log("Add this to .env.local:");
  console.log(`  SYSTEM_USER_ID=${user._id}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
