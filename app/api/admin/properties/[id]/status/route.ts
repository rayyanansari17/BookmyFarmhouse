import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/db/mongoose";
import Property from "@/lib/db/models/Property.model";
import { updatePropertyStatusSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
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

    if (!property) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: property });
  } catch {
    return NextResponse.json({ success: false, error: "Update failed" }, { status: 500 });
  }
}
