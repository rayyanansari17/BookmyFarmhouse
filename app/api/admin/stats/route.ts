import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/db/models/User.model";
import Property from "@/lib/db/models/Property.model";
import Inquiry from "@/lib/db/models/Inquiry.model";
import Location from "@/lib/db/models/Location.model";
import ScrapedListing from "@/lib/db/models/ScrapedListing.model";
import ScrapeJob from "@/lib/db/models/ScrapeJob.model";
import RefreshToken from "@/lib/db/models/RefreshToken.model";
import RequestLog from "@/lib/db/models/RequestLog.model";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  await connectDB();

  const [
    properties,
    deletedProperties,
    users,
    inquiries,
    locations,
    scrapedListings,
    scrapeJobs,
    refreshTokens,
    requestLogs,
  ] = await Promise.all([
    Property.countDocuments({ isDeleted: false }),
    Property.countDocuments({ isDeleted: true }),
    User.countDocuments(),
    Inquiry.countDocuments(),
    Location.countDocuments(),
    ScrapedListing.countDocuments(),
    ScrapeJob.countDocuments(),
    RefreshToken.countDocuments(),
    RequestLog.countDocuments(),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      properties,
      deletedProperties,
      users,
      inquiries,
      locations,
      scrapedListings,
      scrapeJobs,
      refreshTokens,
      requestLogs,
    },
  });
}
