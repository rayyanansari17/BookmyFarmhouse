import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/db/mongoose";
import Blog from "@/lib/db/models/Blog.model";
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDB();
    const { id } = await params;

    const blog = await Blog.findById(id);
    if (!blog) return NextResponse.json({ success: false, error: "Blog not found" }, { status: 404 });

    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    if (!file) return NextResponse.json({ success: false, error: "No image provided" }, { status: 400 });

    // Delete old image from Cloudinary if it exists
    if (blog.featuredImage?.publicId) {
      await deleteFromCloudinary(blog.featuredImage.publicId).catch(() => {});
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadToCloudinary(buffer, `blogs/${id}`, undefined);

    blog.featuredImage = { url: result.url, publicId: result.publicId };
    await blog.save();

    return NextResponse.json({ success: true, data: { url: result.url, publicId: result.publicId } });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDB();
    const { id } = await params;

    const blog = await Blog.findById(id);
    if (!blog) return NextResponse.json({ success: false, error: "Blog not found" }, { status: 404 });

    if (blog.featuredImage?.publicId) {
      await deleteFromCloudinary(blog.featuredImage.publicId).catch(() => {});
    }

    blog.featuredImage = undefined;
    await blog.save();

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
