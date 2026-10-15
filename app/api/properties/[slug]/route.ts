import { NextRequest, NextResponse } from "next/server";
import { getPublicPropertyBySlug } from "@/lib/services/property.service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const property = await getPublicPropertyBySlug(slug);

    if (!property) {
      return NextResponse.json({ success: false, error: "Listing not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: property });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch listing" }, { status: 500 });
  }
}
