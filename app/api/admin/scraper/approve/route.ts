import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/db/mongoose";
import Property from "@/lib/db/models/Property.model";
import mongoose from "mongoose";
import type { PlaceResult } from "../route";

interface ApproveBody {
  results: PlaceResult[];
  city: string;
}

// Curated Unsplash farmhouse photos — free static fallback, no key needed
const FALLBACK_PHOTOS = [
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1560184897-ae75f418493e?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1475855581690-80accde3ae2b?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1541086035-9d9f68fd5fce?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&auto=format&fit=crop",
];

// Pexels free tier: register at pexels.com/api — no billing, no credit card
// Returns a pool of relevant photos to distribute across listings
async function fetchPexelsPhotoPool(query: string, count: number, apiKey: string): Promise<string[]> {
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${Math.min(count * 2, 80)}&orientation=landscape`;
    const res = await fetch(url, {
      headers: { Authorization: apiKey },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json() as { photos?: Array<{ src: { large: string } }> };
    return (data.photos ?? []).map((p) => p.src.large).filter(Boolean);
  } catch {
    return [];
  }
}

// POST /api/admin/scraper/approve — create approved Property docs for selected scrape results
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const systemUserId = process.env.SYSTEM_USER_ID;
  if (!systemUserId) {
    return NextResponse.json(
      { success: false, error: "SYSTEM_USER_ID not configured in environment" },
      { status: 503 }
    );
  }

  const body = await req.json() as ApproveBody;
  const { results, city } = body;

  if (!Array.isArray(results) || results.length === 0) {
    return NextResponse.json({ success: false, error: "No results to approve" }, { status: 400 });
  }

  await connectDB();

  // Pre-fetch a photo pool from Pexels (if key is configured) — one API call for all listings
  const pexelsKey = process.env.PEXELS_API_KEY;
  let photoPool: string[] = [];
  if (pexelsKey) {
    photoPool = await fetchPexelsPhotoPool(`farmhouse event venue india ${city}`, results.length, pexelsKey);
    // If not enough city-specific results, supplement with generic farmhouse photos
    if (photoPool.length < results.length) {
      const extra = await fetchPexelsPhotoPool("farmhouse resort india", results.length, pexelsKey);
      photoPool = [...photoPool, ...extra];
    }
  }

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const place of results) {
    try {
      // Descriptions via Groq (free tier) if configured
      let description = `${place.name} is a farmhouse and event venue located in ${city}. The venue is available for booking for parties, weddings, corporate events, and other celebrations. Contact us to enquire about availability and pricing.`;

      const groqKey = process.env.GROQ_API_KEY;
      if (groqKey) {
        try {
          const groqRes = await fetch(`${process.env.NEXTAUTH_URL}/api/vendor/generate-description`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: place.name, city, amenities: [], eventTypes: [] }),
          });
          if (groqRes.ok) {
            const groqData = await groqRes.json();
            if (groqData.success && groqData.description) description = groqData.description;
          }
        } catch { /* fallback description */ }
      }

      // Photo priority: place's own photoUrl → Pexels pool → Unsplash static fallback
      const photoUrl =
        place.photoUrl ??
        photoPool[created % Math.max(photoPool.length, 1)] ??
        FALLBACK_PHOTOS[created % FALLBACK_PHOTOS.length];

      await Property.create({
        vendorId: new mongoose.Types.ObjectId(systemUserId),
        title: place.name,
        description,
        location: {
          city: city.toLowerCase(),
          address: place.address || city,
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
    photoSource: pexelsKey ? "pexels" : "unsplash-static",
    errors: errors.length > 0 ? errors : undefined,
  });
}
