import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import Inquiry from "@/lib/db/models/Inquiry.model";
import Property from "@/lib/db/models/Property.model";
import { createInquirySchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const parsed = createInquirySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { propertyId, customer, eventDate, guestCount, eventType, message } = parsed.data;

    // Verify property exists and is approved
    const property = await Property.findOne({
      _id: propertyId,
      status: "approved",
      isDeleted: false,
    }).lean();

    if (!property) {
      return NextResponse.json({ success: false, error: "Property not found" }, { status: 404 });
    }

    const inquiry = await Inquiry.create({
      propertyId,
      vendorId: property.vendorId,
      customer,
      eventDate: new Date(eventDate),
      guestCount,
      eventType,
      message,
    });

    return NextResponse.json({ success: true, data: inquiry }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to submit inquiry" }, { status: 500 });
  }
}
