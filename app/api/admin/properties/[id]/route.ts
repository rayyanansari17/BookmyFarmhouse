import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/db/mongoose";
import Property from "@/lib/db/models/Property.model";
import { updatePropertyStatusSchema, updateRatingSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

async function requireAdmin() {
  const session = await auth();
  return session?.user.role === "admin" ? session : null;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();
    const { id } = await params;
    const property = await Property.findById(id)
      .populate("vendorId", "name email businessName phone")
      .lean();
    if (!property) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: property });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const url = req.nextUrl.pathname;

    // Route to the right handler based on URL segment
    if (url.endsWith("/status")) {
      const parsed = updatePropertyStatusSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
      }
      const logEntry = {
        action: parsed.data.status as "approved" | "rejected",
        performedBy: session.user.id,
        note: parsed.data.note,
        timestamp: new Date(),
      };
      const property = await Property.findByIdAndUpdate(
        id,
        { $set: { status: parsed.data.status }, $push: { activityLog: logEntry } },
        { new: true }
      );
      return NextResponse.json({ success: true, data: property });
    }

    if (url.endsWith("/rating")) {
      const parsed = updateRatingSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
      }
      const property = await Property.findByIdAndUpdate(
        id,
        { rating: parsed.data.rating },
        { new: true }
      );
      return NextResponse.json({ success: true, data: property });
    }

    return NextResponse.json({ success: false, error: "Invalid route" }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  try {
    await connectDB();
    const { id } = await params;
    const { hardDelete } = await req.json().catch(() => ({ hardDelete: false }));

    if (hardDelete) {
      await Property.findByIdAndDelete(id);
    } else {
      await Property.findByIdAndUpdate(id, {
        $set: { isDeleted: true, deletedAt: new Date() },
        $push: { activityLog: { action: "deleted", performedBy: session.user.id, timestamp: new Date() } },
      });
    }

    return NextResponse.json({ success: true, message: "Deleted" });
  } catch {
    return NextResponse.json({ success: false, error: "Delete failed" }, { status: 500 });
  }
}
