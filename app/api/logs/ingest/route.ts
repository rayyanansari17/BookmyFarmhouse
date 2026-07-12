import { NextRequest, NextResponse } from "next/server";
import { logApiRequest } from "@/lib/services/request-log.service";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-log-secret");
  if (!secret || secret !== process.env.LOG_INGEST_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const body = await req.json();
    await logApiRequest(body);
  } catch (err) {
    console.error("[logs/ingest]", err);
  }

  return NextResponse.json({ ok: true });
}
