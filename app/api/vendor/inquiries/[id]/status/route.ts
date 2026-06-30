import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/db/mongoose";
import Inquiry from "@/lib/db/models/Inquiry.model";
import { updateInquiryStatusSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || session.user.role !== "vendor") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const parsed = updateInquiryStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const inquiry = await Inquiry.findOneAndUpdate(
      { _id: id, vendorId: session.user.id },
      { status: parsed.data.status },
      { new: true }
    );

    if (!inquiry) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: inquiry });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to update status" }, { status: 500 });
  }
}
