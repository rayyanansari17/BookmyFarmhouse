import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/db/models/User.model";
import RefreshToken from "@/lib/db/models/RefreshToken.model";
import { updateVendorStatusSchema } from "@/lib/validators";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const parsed = updateVendorStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const user = await User.findByIdAndUpdate(id, parsed.data, { new: true });
    if (!user) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

    // On suspension: revoke all active refresh tokens so user is logged out immediately
    if (parsed.data.isSuspended) {
      await RefreshToken.updateMany({ userId: id }, { isRevoked: true });
    }

    return NextResponse.json({ success: true, data: user });
  } catch {
    return NextResponse.json({ success: false, error: "Update failed" }, { status: 500 });
  }
}
