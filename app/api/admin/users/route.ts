import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/db/models/User.model";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDB();
    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);

    // Never expose admins through this endpoint
    const filter: Record<string, unknown> = { role: "vendor" };

    if (status === "active") { filter.isActive = true; filter.isSuspended = false; }
    else if (status === "inactive") filter.isActive = false;
    else if (status === "suspended") filter.isSuspended = true;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { businessName: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: users,
      pagination: { total, pages: Math.ceil(total / limit), current: page, limit },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch users" }, { status: 500 });
  }
}
