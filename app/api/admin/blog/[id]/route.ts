import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/db/mongoose";
import Blog from "@/lib/db/models/Blog.model";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const { id } = await params;
  const blog = await Blog.findById(id).lean();
  if (!blog) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true, data: blog });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const { id } = await params;
  const updates = await req.json();

  // Recalculate word count if bodyHtml is being updated
  if (updates.bodyHtml) {
    const text = updates.bodyHtml.replace(/<[^>]+>/g, " ");
    updates.wordCount = text.split(/\s+/).filter(Boolean).length;
  }

  const blog = await Blog.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
  if (!blog) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true, data: blog });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const { id } = await params;
  await Blog.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
