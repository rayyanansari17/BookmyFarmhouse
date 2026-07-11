import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import ScrapeJob from "@/lib/db/models/ScrapeJob.model";
import ScrapedListing from "@/lib/db/models/ScrapedListing.model";

type Params = { params: Promise<{ id: string }> };

// POST /api/admin/scraper/jobs/:id/results
// Called by Railway scraper service when a job finishes.
// Body: { listings: ScrapedListing[], duplicatesSkipped?: number }
export async function POST(req: NextRequest, { params }: Params) {
  const secret = process.env.SCRAPER_SECRET;
  if (secret && req.headers.get("x-scraper-secret") !== secret) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const { id } = await params;

  const job = await ScrapeJob.findById(id);
  if (!job) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  const body = await req.json() as {
    listings: Array<{
      name: string;
      area?: string;
      city?: string;
      address?: string;
      phone?: string;
      phones?: string[];
      imageUrls?: string[];
      amenities?: string[];
      capacity?: number;
      priceRange?: string;
      description?: string;
      category?: string;
      sourceUrl?: string;
    }>;
    duplicatesSkipped?: number;
  };

  const { listings = [], duplicatesSkipped = 0 } = body;

  let imported = 0;
  for (const listing of listings) {
    try {
      const validSources = ["justdial", "sulekha", "wedmegood", "manual"] as const;
      const validCats = ["farmhouse", "banquet", "resort", "villa"] as const;
      type Source = typeof validSources[number];
      type Category = typeof validCats[number];

      const source: Source = (validSources as readonly string[]).includes(job.source)
        ? (job.source as Source)
        : "manual";
      const category: Category = (validCats as readonly string[]).includes(listing.category ?? "")
        ? (listing.category as Category)
        : "farmhouse";

      await ScrapedListing.create({
        source,
        sourceUrl: listing.sourceUrl,
        scrapeJobId: id,
        name: listing.name,
        area: listing.area,
        city: listing.city ?? job.city,
        address: listing.address,
        phone: listing.phone,
        phones: listing.phones ?? (listing.phone ? [listing.phone] : []),
        imageUrls: listing.imageUrls ?? [],
        amenities: listing.amenities ?? [],
        capacity: listing.capacity,
        priceRange: listing.priceRange,
        description: listing.description,
        category,
      });
      imported++;
    } catch {
      // Skip duplicates / invalid entries
    }
  }

  job.status = "completed";
  job.imported = imported;
  job.found = listings.length + duplicatesSkipped;
  job.duplicatesSkipped = duplicatesSkipped;
  job.completedAt = new Date();
  job.progress = 100;
  job.logs.push(`Completed — ${imported} listings saved, ${duplicatesSkipped} duplicates skipped`);
  if (job.logs.length > 50) job.logs = job.logs.slice(-50);
  await job.save();

  return NextResponse.json({ success: true, imported });
}
