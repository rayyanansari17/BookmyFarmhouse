import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/db/models/User.model";
import mongoose from "mongoose";
import { z } from "zod";

const SubscriptionBody = z.object({
  plan: z.enum(["free", "growth", "pro"]),
});

// PATCH /api/admin/users/[id]/subscription — manually override a vendor's subscription plan
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ success: false, error: "Invalid user ID" }, { status: 400 });
  }

  const parsed = SubscriptionBody.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid plan" }, { status: 400 });
  }

  await connectDB();

  const user = await User.findByIdAndUpdate(
    id,
    {
      subscriptionPlan: parsed.data.plan,
      // Reset monthly counter when plan changes
      monthlyLeadRevealCount: 0,
      leadCountResetAt: new Date(),
    },
    { new: true, select: "name email subscriptionPlan monthlyLeadRevealCount" }
  );

  if (!user) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: user });
}
