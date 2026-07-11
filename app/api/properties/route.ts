import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Property from "@/lib/db/models/Property.model";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = req.nextUrl;
    const city = searchParams.get("city");
    const priceMin = searchParams.get("priceMin");
    const priceMax = searchParams.get("priceMax");
    const minGuests = searchParams.get("minGuests");
    const maxGuests = searchParams.get("maxGuests");
    const amenities = searchParams.getAll("amenities");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") ?? "newest";
    const featured = searchParams.get("featured");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "10"), 50);

    // Base filter: only approved, non-deleted listings
    const filter: Record<string, unknown> = { status: "approved", isDeleted: false };

    if (city) filter["location.city"] = city.toLowerCase();
    if (priceMin) filter["priceRange.min"] = { $gte: parseInt(priceMin) };
    if (priceMax) filter["priceRange.max"] = { $lte: parseInt(priceMax) };
    if (minGuests) filter["capacity.max"] = { $gte: parseInt(minGuests) };
    if (maxGuests)
      filter["capacity.min"] = { ...(filter["capacity.min"] as object ?? {}), $lte: parseInt(maxGuests) };
    if (amenities.length > 0) filter.amenities = { $all: amenities };
    if (featured === "true") filter.rating = { $gte: 4 };

    // Text search (MongoDB full-text index)
    if (search) (filter as Record<string, unknown>).$text = { $search: search };

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      newest: { createdAt: -1 },
      rating: { rating: -1, createdAt: -1 },
      price_asc: { "priceRange.min": 1 },
      price_desc: { "priceRange.max": -1 },
    };
    const sort = sortMap[sortBy] ?? sortMap.newest;

    const skip = (page - 1) * limit;
    const [properties, total] = await Promise.all([
      Property.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Property.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: properties,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: page,
        limit,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Search failed" }, { status: 500 });
  }
}
