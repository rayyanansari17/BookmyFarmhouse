import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/db/mongoose";
import ScrapedListing from "@/lib/db/models/ScrapedListing.model";
import ScrapeJob from "@/lib/db/models/ScrapeJob.model";

export async function DELETE() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const [listingsResult, jobsResult] = await Promise.all([
    ScrapedListing.deleteMany({}),
    ScrapeJob.deleteMany({}),
  ]);

  return NextResponse.json({
    success: true,
    deletedListings: listingsResult.deletedCount,
    deletedJobs: jobsResult.deletedCount,
  });
}
