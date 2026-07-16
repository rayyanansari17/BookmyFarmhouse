import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/db/mongoose";
import Blog from "@/lib/db/models/Blog.model";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  await connectDB();

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const contentType = searchParams.get("contentType");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (contentType) filter.contentType = contentType;

  const [blogs, total] = await Promise.all([
    Blog.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    Blog.countDocuments(filter),
  ]);

  return NextResponse.json({
    success: true,
    data: blogs,
    pagination: { total, page, pages: Math.ceil(total / limit), limit },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  await connectDB();

  const body = await req.json();
  const { targetKeyword, contentType, title, slug, ...rest } = body;

  if (!targetKeyword || !contentType) {
    return NextResponse.json({ success: false, error: "targetKeyword and contentType are required" }, { status: 400 });
  }

  const autoSlug = slug || targetKeyword.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  let blog;
  try {
    blog = await Blog.create({
      slug: autoSlug,
      title: title || targetKeyword,
      targetKeyword,
      contentType,
      status: "keyword_identified",
      ...rest,
    });
  } catch (err: unknown) {
    // Duplicate slug — return the existing blog instead of erroring
    if ((err as { code?: number }).code === 11000) {
      const existing = await Blog.findOne({ slug: autoSlug }).lean();
      if (existing) return NextResponse.json({ success: true, data: existing }, { status: 200 });
    }
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: blog }, { status: 201 });
}
