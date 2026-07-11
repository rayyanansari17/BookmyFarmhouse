import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/db/mongoose";
import ScrapedListing from "@/lib/db/models/ScrapedListing.model";
import Property from "@/lib/db/models/Property.model";
import mongoose from "mongoose";

const SYSTEM_USER_ID = process.env.SYSTEM_USER_ID ?? "6a511c259bd80ada6d49f98c";

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

  let published = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const id of ids) {
    try {
      const scraped = await ScrapedListing.findById(id);
      if (!scraped) { errors.push(`${id}: not found`); continue; }
      if (scraped.status !== "approved") { skipped++; continue; }

      // Merge editedData on top of base fields
      const data = { ...(scraped.toObject()), ...(scraped.editedData ?? {}) };
      const phone = (data.phone as string | undefined) ?? (data.phones as string[] | undefined)?.[0];

      // Dedup by phone — skip if a Property with this phone already exists
      if (phone) {
        const dupe = await Property.findOne({ scrapedPhone: phone, isDeleted: false });
        if (dupe) { skipped++; continue; }
      }

      // Title must be at least 10 chars (Property schema minlength)
      const rawTitle = (data.name as string) ?? "Unnamed Venue";
      const title = rawTitle.length < 10 ? rawTitle.padEnd(10, " ") : rawTitle;

      const property = await Property.create({
        vendorId: new mongoose.Types.ObjectId(SYSTEM_USER_ID),
        title,
        description: (data.description as string | undefined) ?? undefined,
        location: {
          city: (data.city as string) ?? "",
          state: "",
          address: (data.address as string | undefined) ?? undefined,
        },
        capacity: (data.capacity as number | undefined)
          ? { min: 1, max: data.capacity as number }
          : undefined,
        amenities: (data.amenities as string[] | undefined) ?? [],
        images: [],
        externalImageUrls: (data.imageUrls as string[] | undefined) ?? [],
        source: "scraped",
        claimed: false,
        status: "approved",
        scrapedPhone: phone ?? undefined,
        scrapedWebsite: (data.sourceUrl as string | undefined) ?? undefined,
        activityLog: [
          {
            action: "approved",
            performedBy: new mongoose.Types.ObjectId(session.user.id),
            note: `Bulk-published from scrape (source: ${scraped.source})`,
            timestamp: new Date(),
          },
        ],
      });

      await ScrapedListing.findByIdAndUpdate(id, {
        $set: {
          status: "published",
          publishedPropertyId: property._id,
          publishedAt: new Date(),
        },
      });

      published++;
    } catch (err) {
      errors.push(`${id}: ${err instanceof Error ? err.message : "unknown error"}`);
    }
  }

  return NextResponse.json({ success: true, published, skipped, errors });
}
