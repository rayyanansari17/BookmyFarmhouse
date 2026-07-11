import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/db/mongoose";
import ScrapedListing from "@/lib/db/models/ScrapedListing.model";

type Params = { params: Promise<{ id: string }> };

const ALLOWED_STATUSES = ["pending", "approved", "rejected"] as const;
type AllowedStatus = typeof ALLOWED_STATUSES[number];

// PATCH /api/admin/scraper/scraped/:id/status
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json() as { status: AllowedStatus };

  if (!ALLOWED_STATUSES.includes(body.status)) {
    return NextResponse.json(
      { success: false, error: "status must be one of: pending, approved, rejected" },
      { status: 400 }
    );
  }

  await connectDB();
  const listing = await ScrapedListing.findByIdAndUpdate(
    id,
    { $set: { status: body.status } },
    { new: true }
  );
  if (!listing) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true, data: listing });
}
