import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/db/mongoose";
import Location from "@/lib/db/models/Location.model";
import { createLocationSchema } from "@/lib/validators";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDB();
    const locations = await Location.find().sort({ city: 1 }).lean();
    return NextResponse.json({ success: true, data: locations });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDB();
    const body = await req.json();
    const parsed = createLocationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const location = await Location.create(parsed.data);
    return NextResponse.json({ success: true, data: location }, { status: 201 });
  } catch (err: unknown) {
    const isDuplicate = (err as { code?: number }).code === 11000;
    return NextResponse.json(
      { success: false, error: isDuplicate ? "City already exists" : "Failed to create" },
      { status: isDuplicate ? 409 : 500 }
    );
  }
}
