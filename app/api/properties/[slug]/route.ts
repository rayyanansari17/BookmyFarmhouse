import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Property from "@/lib/db/models/Property.model";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();
    const { slug } = await params;

    const property = await Property.findOne({
      slug,
      status: "approved",
      isDeleted: false,
    })
      .populate("vendorId", "name email businessName profileImage about phone")
      .lean();

    if (!property) {
      return NextResponse.json({ success: false, error: "Listing not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: property });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch listing" }, { status: 500 });
  }
}
