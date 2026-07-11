import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/db/mongoose";
import ScrapedListing from "@/lib/db/models/ScrapedListing.model";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const { id } = await params;
  const listing = await ScrapedListing.findById(id).lean();
  if (!listing) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true, data: listing });
}

// PATCH — save admin edits to editedData delta
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const { id } = await params;
  const body = await req.json() as { editedData?: Record<string, unknown>; adminNotes?: string };

  const update: Record<string, unknown> = {};
  if (body.editedData) update.editedData = body.editedData;
  if (typeof body.adminNotes === "string") update.adminNotes = body.adminNotes;

  const listing = await ScrapedListing.findByIdAndUpdate(
    id,
    { $set: update },
    { new: true, runValidators: true }
  );
  if (!listing) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true, data: listing });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const { id } = await params;
  const listing = await ScrapedListing.findByIdAndDelete(id);
  if (!listing) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true });
}
