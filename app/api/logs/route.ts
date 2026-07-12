import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { listApiRequestLogs } from "@/lib/services/request-log.service";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const action = searchParams.get("action") || undefined;
  const search = searchParams.get("search") || undefined;
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const { items, total } = await listApiRequestLogs({ action, search, limit, offset });

  return NextResponse.json({ success: true, data: items, total });
}
