import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/db/mongoose";
import Property from "@/lib/db/models/Property.model";
import { uploadToCloudinary } from "@/lib/cloudinary";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || session.user.role !== "vendor") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const { id } = await params;

    const property = await Property.findOne({ _id: id, vendorId: session.user.id });
    if (!property) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    if (property.images.length >= 10) {
      return NextResponse.json(
        { success: false, error: "Maximum 10 images allowed" },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const files = formData.getAll("images") as File[];

    if (!files.length) {
      return NextResponse.json({ success: false, error: "No files provided" }, { status: 400 });
    }

    const slotsLeft = 10 - property.images.length;
    const filesToUpload = files.slice(0, slotsLeft);

    const uploadResults = await Promise.all(
      filesToUpload.map(async (file, i) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        return uploadToCloudinary(buffer, `properties/${id}`, undefined);
      })
    );

    const newImages = uploadResults.map((r, i) => ({
      url: r.url,
      publicId: r.publicId,
      order: property.images.length + i,
    }));

    await Property.findByIdAndUpdate(id, { $push: { images: { $each: newImages } } });

    return NextResponse.json({ success: true, data: { images: newImages } });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Upload failed" }, { status: 500 });
  }
}
