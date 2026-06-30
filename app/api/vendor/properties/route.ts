import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/db/mongoose";
import Property from "@/lib/db/models/Property.model";
import Location from "@/lib/db/models/Location.model";
import { createPropertySchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "vendor") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");

    const filter: Record<string, unknown> = { vendorId: session.user.id };
    if (status && status !== "all") filter.status = status;

    const skip = (page - 1) * limit;
    const [properties, total] = await Promise.all([
      Property.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Property.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: properties,
      pagination: { total, pages: Math.ceil(total / limit), current: page, limit },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch listings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "vendor") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const body = await req.json();
    const parsed = createPropertySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { city, state, address, capacityMin, capacityMax, priceMin, priceMax, ...rest } =
      parsed.data;

    // Validate city exists
    const location = await Location.findOne({ city: city.toLowerCase(), isActive: true });
    if (!location) {
      return NextResponse.json({ success: false, error: "Invalid city" }, { status: 400 });
    }

    const property = await Property.create({
      ...rest,
      vendorId: session.user.id,
      location: { city: city.toLowerCase(), state: state ?? location.state, address },
      capacity: { min: capacityMin, max: capacityMax },
      priceRange: { min: priceMin, max: priceMax },
      activityLog: [{ action: "submitted", performedBy: session.user.id }],
    });

    return NextResponse.json({ success: true, data: property }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Failed to create listing" }, { status: 500 });
  }
}
