import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Location from "@/lib/db/models/Location.model";

export async function GET() {
  try {
    await connectDB();
    const locations = await Location.find({ isActive: true }).sort({ city: 1 }).lean();
    return NextResponse.json({ success: true, data: locations });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch locations" }, { status: 500 });
  }
}
