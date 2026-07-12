import { NextRequest, NextResponse } from "next/server";
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

type Params = { params: Promise<{ collection: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { collection } = await params;
  await connectDB();

  let deleted = 0;

  switch (collection) {
    case "properties": {
      // Cascade: deleting all properties also wipes all inquiries that reference them
      const [p, i] = await Promise.all([
        Property.deleteMany({}),
        Inquiry.deleteMany({}),
      ]);
      deleted = p.deletedCount + i.deletedCount;
      break;
    }
    case "deletedProperties": {
      const r = await Property.deleteMany({ isDeleted: true });
      deleted = r.deletedCount;
      break;
    }
    case "users": {
      // Cascade: deleting all users also wipes their refresh tokens
      const [u, rt] = await Promise.all([
        User.deleteMany({}),
        RefreshToken.deleteMany({}),
      ]);
      deleted = u.deletedCount + rt.deletedCount;
      break;
    }
    case "inquiries": {
      const r = await Inquiry.deleteMany({});
      deleted = r.deletedCount;
      break;
    }
    case "locations": {
      const r = await Location.deleteMany({});
      deleted = r.deletedCount;
      break;
    }
    case "scrapedListings": {
      const r = await ScrapedListing.deleteMany({});
      deleted = r.deletedCount;
      break;
    }
    case "scrapeJobs": {
      const r = await ScrapeJob.deleteMany({});
      deleted = r.deletedCount;
      break;
    }
    case "refreshTokens": {
      const r = await RefreshToken.deleteMany({});
      deleted = r.deletedCount;
      break;
    }
    case "requestLogs": {
      const r = await RequestLog.deleteMany({});
      deleted = r.deletedCount;
      break;
    }
    default:
      return NextResponse.json({ success: false, error: "Unknown collection" }, { status: 400 });
  }

  return NextResponse.json({ success: true, deleted });
}
