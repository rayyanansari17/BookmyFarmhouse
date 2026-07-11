import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/db/mongoose";
import Inquiry from "@/lib/db/models/Inquiry.model";

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
    const [rawInquiries, total] = await Promise.all([
      Inquiry.find(filter)
        .populate("propertyId", "title slug images")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Inquiry.countDocuments(filter),
    ]);

    // Strip contact details — callers must POST /[id]/reveal to unlock them
    const inquiries = rawInquiries.map(({ customer, ...rest }) => ({
      ...rest,
      customer: { name: customer.name },
    }));

    return NextResponse.json({
      success: true,
      data: inquiries,
      pagination: { total, pages: Math.ceil(total / limit), current: page, limit },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch leads" }, { status: 500 });
  }
}
