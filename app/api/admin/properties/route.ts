import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/db/mongoose";
import Property from "@/lib/db/models/Property.model";

function requireAdmin() {
  return auth().then((session) => {
    if (!session || session.user.role !== "admin") return null;
    return session;
  });
}

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();
    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status");
    const city = searchParams.get("city");
    const vendorId = searchParams.get("vendorId");
    const showDeleted = searchParams.get("isDeleted") === "true";
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);

    const search = searchParams.get("search");

    const filter: Record<string, unknown> = { isDeleted: showDeleted };
    if (status && status !== "all") filter.status = status;
    if (city) filter["location.city"] = city.toLowerCase();
    if (vendorId) filter.vendorId = vendorId;
    if (search) filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { "location.city": { $regex: search, $options: "i" } },
    ];

    const skip = (page - 1) * limit;
    const [properties, total] = await Promise.all([
      Property.find(filter)
        .populate("vendorId", "name email businessName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-activityLog -description")
        .lean(),
      Property.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: properties,
      pagination: { total, pages: Math.ceil(total / limit), current: page, limit },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch" }, { status: 500 });
  }
}
