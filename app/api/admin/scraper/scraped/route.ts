import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/db/mongoose";
import ScrapedListing from "@/lib/db/models/ScrapedListing.model";

// GET /api/admin/scraper/scraped
// Filters: status, source, city, jobId, search, page, limit
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const { searchParams } = new URL(req.url);

  const status = searchParams.get("status");
  const source = searchParams.get("source");
  const city = searchParams.get("city");
  const jobId = searchParams.get("jobId");
  const search = searchParams.get("search");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "24"), 100);
  const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);

  const filter: Record<string, unknown> = {};
  if (status && status !== "all") filter.status = status;
  if (source) filter.source = source;
  if (city) filter.city = city.toLowerCase();
  if (jobId) filter.scrapeJobId = jobId;
  if (search) filter.name = { $regex: search, $options: "i" };

  const skip = (page - 1) * limit;
  const [listings, total] = await Promise.all([
    ScrapedListing.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ScrapedListing.countDocuments(filter),
  ]);

  return NextResponse.json({ success: true, data: listings, total, page, limit });
}
