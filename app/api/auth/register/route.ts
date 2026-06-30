import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/mongoose";
import User from "@/lib/db/models/User.model";
import { registerSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password, phone, whatsapp, businessName } = parsed.data;

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      passwordHash,
      phone,
      whatsapp,
      businessName,
      role: "vendor",
      authProvider: "local",
    });

    const { passwordHash: _, ...safeUser } = user.toObject();

    return NextResponse.json({ success: true, data: { user: safeUser } }, { status: 201 });
  } catch (err: unknown) {
    const isDuplicate = (err as { code?: number }).code === 11000;
    return NextResponse.json(
      { success: false, error: isDuplicate ? "Email already registered" : "Registration failed" },
      { status: isDuplicate ? 409 : 500 }
    );
  }
}
