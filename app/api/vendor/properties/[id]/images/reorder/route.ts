import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/db/mongoose";
import Property from "@/lib/db/models/Property.model";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || session.user.role !== "vendor") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const { id } = await params;
    const { images } = await req.json() as { images: { publicId: string; order: number }[] };

    const property = await Property.findOne({ _id: id, vendorId: session.user.id });
    if (!property) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    for (const img of property.images) {
      const update = images.find((i) => i.publicId === img.publicId);
      if (update) img.order = update.order;
    }

    property.images.sort((a, b) => a.order - b.order);
    await property.save();

    return NextResponse.json({ success: true, data: { images: property.images } });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to reorder" }, { status: 500 });
  }
}
