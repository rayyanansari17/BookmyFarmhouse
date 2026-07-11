import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/db/mongoose";
import ScrapedListing from "@/lib/db/models/ScrapedListing.model";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { ids } = await req.json() as { ids: string[] };
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ success: false, error: "ids array is required" }, { status: 400 });
  }

  await connectDB();
  const result = await ScrapedListing.updateMany(
    { _id: { $in: ids }, status: { $ne: "published" } },
    { $set: { status: "rejected" } }
  );

  return NextResponse.json({ success: true, modified: result.modifiedCount });
}
