import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/db/mongoose";
import Property from "@/lib/db/models/Property.model";
import mongoose from "mongoose";
import type { PlaceResult } from "../route";

interface ImportBody {
  results: PlaceResult[];
  city: string;
}

// Fallback photos used when a scraped venue has no photo (same list as approve/route.ts)
const FALLBACK_PHOTOS = [
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1560184897-ae75f418493e?w=800&auto=format&fit=crop",
];

// POST /api/admin/scraper/import
// Accepts JSON from the local scrape-google-maps.ts script and bulk-creates listings.
// Photos come from Google Maps (lh3.googleusercontent.com) — no Pexels needed.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // Fall back to the admin's own ID if SYSTEM_USER_ID is not set
  const systemUserId = process.env.SYSTEM_USER_ID ?? session.user.id;

  const body = await req.json() as ImportBody;
  const { results, city } = body;

  if (!Array.isArray(results) || results.length === 0) {
    return NextResponse.json({ success: false, error: "No results provided" }, { status: 400 });
  }
  if (!city?.trim()) {
    return NextResponse.json({ success: false, error: "city is required" }, { status: 400 });
  }

  await connectDB();

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const place of results) {
    try {
      // Dedup: skip if a property with the same title already exists in this city
      const existing = await Property.findOne({
        title: { $regex: `^${place.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
        "location.city": city.toLowerCase(),
        isDeleted: false,
      }).lean();
      if (existing) { skipped++; continue; }

      // Generate description via Groq (free tier) if available
      let description = `${place.name} is a farmhouse and event venue located in ${city}. The venue is available for booking for parties, weddings, corporate events, and other celebrations. Contact us to enquire about availability and pricing.`;

      const groqKey = process.env.GROQ_API_KEY;
      if (groqKey) {
        try {
          const groqRes = await fetch(
            `${process.env.NEXTAUTH_URL}/api/vendor/generate-description`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ title: place.name, city, amenities: [], eventTypes: [] }),
            }
          );
          if (groqRes.ok) {
            const groqData = await groqRes.json();
            if (groqData.success && groqData.description) description = groqData.description;
          }
        } catch { /* use default description */ }
      }

      // Photo: use Google Maps URL directly if present, otherwise cycle through fallbacks
      const photoUrl =
        place.photoUrl ?? FALLBACK_PHOTOS[created % FALLBACK_PHOTOS.length];

      // Sanitize address — reject "[]", "null", "undefined", or empty strings
      const rawAddr = place.address?.trim() ?? "";
      const cleanAddr = rawAddr && rawAddr !== "[]" && rawAddr !== "null" && rawAddr !== "undefined"
        ? rawAddr
        : undefined;

      await Property.create({
        vendorId: new mongoose.Types.ObjectId(systemUserId),
        title: place.name,
        description,
        location: {
          city: city.toLowerCase(),
          address: cleanAddr,
        },
        capacity: { min: 50, max: 300 },
        priceRange: { min: 10000, max: 50000 },
        amenities: [],
        images: [{ url: photoUrl, publicId: place.placeId, order: 0 }],
        status: "approved",
        source: "scraped",
        claimed: false,
        googlePlaceId: place.placeId,
        scrapedPhone: place.phone,
        scrapedWebsite: place.website,
      });
      created++;
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("duplicate key")) {
        skipped++;
      } else {
        errors.push(place.name);
      }
    }
  }

  return NextResponse.json({
    success: true,
    created,
    skipped,
    errors: errors.length > 0 ? errors : undefined,
  });
}
