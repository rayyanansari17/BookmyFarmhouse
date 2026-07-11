import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/db/mongoose";
import Inquiry from "@/lib/db/models/Inquiry.model";
import User from "@/lib/db/models/User.model";
import mongoose from "mongoose";
import { getLeadLimit, shouldResetCount } from "@/lib/subscription";
import type { SubscriptionPlan } from "@/lib/subscription";

// POST /api/vendor/inquiries/[id]/reveal — spend a credit to unlock contact details
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "vendor") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ success: false, error: "Invalid inquiry ID" }, { status: 400 });
  }

  await connectDB();

  // Fetch the inquiry and verify it belongs to this vendor
  const inquiry = await Inquiry.findOne({
    _id: id,
    vendorId: new mongoose.Types.ObjectId(session.user.id),
  }).lean();

  if (!inquiry) {
    return NextResponse.json({ success: false, error: "Inquiry not found" }, { status: 404 });
  }

  // Fetch the vendor to check subscription state
  const vendor = await User.findById(session.user.id).select(
    "subscriptionPlan monthlyLeadRevealCount leadCountResetAt"
  );
  if (!vendor) {
    return NextResponse.json({ success: false, error: "Vendor not found" }, { status: 404 });
  }

  // Reset monthly counter if the 30-day window has passed
  if (shouldResetCount(vendor.leadCountResetAt)) {
    vendor.monthlyLeadRevealCount = 0;
    vendor.leadCountResetAt = new Date();
    await vendor.save();
  }

  const plan = (vendor.subscriptionPlan ?? "free") as SubscriptionPlan;
  const limit = getLeadLimit(plan);
  const used = vendor.monthlyLeadRevealCount ?? 0;

  if (used >= limit) {
    return NextResponse.json(
      {
        success: false,
        error: "LIMIT_REACHED",
        plan,
        limit,
        used,
        upgradeUrl: "/vendor/upgrade",
        message:
          plan === "free"
            ? `You've used all ${limit} free lead reveals this month. Upgrade to Growth for 30 reveals/month.`
            : `You've used all ${limit} lead reveals this month. Upgrade to Pro for unlimited reveals.`,
      },
      { status: 402 }
    );
  }

  // Increment the counter
  vendor.monthlyLeadRevealCount = used + 1;
  await vendor.save();

  return NextResponse.json({
    success: true,
    contact: {
      phone: inquiry.customer.phone,
      email: inquiry.customer.email,
    },
    remaining: limit === Infinity ? Infinity : limit - (used + 1),
    plan,
  });
}
