import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/db/mongoose";
import Inquiry from "@/lib/db/models/Inquiry.model";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDB();
    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);

    const filter: Record<string, unknown> = {};
    if (status && status !== "all") filter.status = status;

    const skip = (page - 1) * limit;
    const [inquiries, total] = await Promise.all([
      Inquiry.find(filter)
        .populate("propertyId", "title slug")
        .populate("vendorId", "name email businessName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Inquiry.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: inquiries,
      pagination: { total, pages: Math.ceil(total / limit), current: page, limit },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch" }, { status: 500 });
  }
}
