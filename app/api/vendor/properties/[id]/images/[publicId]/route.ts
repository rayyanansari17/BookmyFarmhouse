import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/db/mongoose";
import Property from "@/lib/db/models/Property.model";
import { deleteFromCloudinary } from "@/lib/cloudinary";

type Params = { params: Promise<{ id: string; publicId: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || session.user.role !== "vendor") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const { id, publicId } = await params;
    // publicId arrives URL-encoded (slashes → %2F)
    const decodedPublicId = decodeURIComponent(publicId);

    const property = await Property.findOne({ _id: id, vendorId: session.user.id });
    if (!property) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    await deleteFromCloudinary(decodedPublicId);

    await Property.findByIdAndUpdate(id, {
      $pull: { images: { publicId: decodedPublicId } },
    });

    return NextResponse.json({ success: true, message: "Image deleted" });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to delete image" }, { status: 500 });
  }
}
