import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import ScrapeJob from "@/lib/db/models/ScrapeJob.model";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/admin/scraper/jobs/:id/progress
// Called by the Railway scraper service — protected by SCRAPER_SECRET header.
export async function PATCH(req: NextRequest, { params }: Params) {
  const secret = process.env.SCRAPER_SECRET;
  if (secret && req.headers.get("x-scraper-secret") !== secret) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const { id } = await params;
  const body = await req.json() as {
    progress?: number;
    found?: number;
    imported?: number;
    duplicatesSkipped?: number;
    logEntry?: string;
    error?: string;
    status?: string;
  };

  const update: Record<string, unknown> = {};
  if (typeof body.progress === "number") update.progress = body.progress;
  if (typeof body.found === "number") update.found = body.found;
  if (typeof body.imported === "number") update.imported = body.imported;
  if (typeof body.duplicatesSkipped === "number") update.duplicatesSkipped = body.duplicatesSkipped;
  if (body.error) { update.status = "failed"; update.error = body.error; update.completedAt = new Date(); }
  if (body.status) update.status = body.status;

  const pushOp: Record<string, unknown> = {};
  if (body.logEntry) {
    // Keep max 50 log entries — $push + $slice
    pushOp.logs = { $each: [body.logEntry], $slice: -50 };
  }

  const job = await ScrapeJob.findByIdAndUpdate(
    id,
    { $set: update, ...(Object.keys(pushOp).length ? { $push: pushOp } : {}) },
    { new: true }
  );

  if (!job) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
