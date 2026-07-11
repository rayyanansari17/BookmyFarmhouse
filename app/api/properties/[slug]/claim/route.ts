import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/db/mongoose";
import Property from "@/lib/db/models/Property.model";
import mongoose from "mongoose";

type Params = { params: Promise<{ slug: string }> };

// POST /api/properties/:slug/claim — vendor claims an unclaimed scraped listing
export async function POST(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || session.user.role !== "vendor") {
    return NextResponse.json({ success: false, error: "Vendor account required" }, { status: 401 });
  }

  await connectDB();
  const { slug } = await params;

  const property = await Property.findOne({
    slug,
    source: "scraped",
    claimed: false,
    isDeleted: false,
  });

  if (!property) {
    return NextResponse.json(
      { success: false, error: "Listing not found or already claimed" },
      { status: 404 }
    );
  }

  property.claimed = true;
  property.claimedAt = new Date();
  property.vendorId = new mongoose.Types.ObjectId(session.user.id);
  property.source = "scraped"; // keep source so history is preserved
  property.activityLog.push({
    action: "edited",
    performedBy: new mongoose.Types.ObjectId(session.user.id),
    note: "Listing claimed by vendor",
    timestamp: new Date(),
  });

  await property.save();

  return NextResponse.json({ success: true, data: { slug: property.slug, title: property.title } });
}
