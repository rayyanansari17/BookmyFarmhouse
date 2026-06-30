import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/db/mongoose";
import Property from "@/lib/db/models/Property.model";
import { updatePropertySchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || session.user.role !== "vendor") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const { id } = await params;
    const property = await Property.findOne({ _id: id, vendorId: session.user.id }).lean();
    if (!property) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: property });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || session.user.role !== "vendor") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const parsed = updatePropertySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { city, state, address, capacityMin, capacityMax, priceMin, priceMax, ...rest } = parsed.data;

    const existing = await Property.findOne({ _id: id, vendorId: session.user.id });
    if (!existing) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    const updates: Record<string, unknown> = { ...rest };
    if (city) updates["location.city"] = city.toLowerCase();
    if (state) updates["location.state"] = state;
    if (address !== undefined) updates["location.address"] = address;
    if (capacityMin !== undefined) updates["capacity.min"] = capacityMin;
    if (capacityMax !== undefined) updates["capacity.max"] = capacityMax;
    if (priceMin !== undefined) updates["priceRange.min"] = priceMin;
    if (priceMax !== undefined) updates["priceRange.max"] = priceMax;

    // Editing a non-pending listing resets it to pending for re-review
    if (existing.status !== "pending") updates.status = "pending";

    const logEntry = { action: "edited" as const, performedBy: session.user.id, timestamp: new Date() };

    const updated = await Property.findByIdAndUpdate(
      id,
      { $set: updates, $push: { activityLog: logEntry } },
      { new: true }
    );

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || session.user.role !== "vendor") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const { id } = await params;
    const logEntry = { action: "deleted" as const, performedBy: session.user.id, timestamp: new Date() };

    const property = await Property.findOneAndUpdate(
      { _id: id, vendorId: session.user.id },
      { $set: { isDeleted: true, deletedAt: new Date() }, $push: { activityLog: logEntry } },
      { new: true }
    );

    if (!property) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, message: "Listing deleted" });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to delete" }, { status: 500 });
  }
}
