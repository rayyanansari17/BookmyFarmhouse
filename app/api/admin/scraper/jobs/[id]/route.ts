import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/db/mongoose";
import ScrapeJob from "@/lib/db/models/ScrapeJob.model";

type Params = { params: Promise<{ id: string }> };

// GET /api/admin/scraper/jobs/:id
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const { id } = await params;
  const job = await ScrapeJob.findById(id).lean();
  if (!job) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true, data: job });
}

// DELETE /api/admin/scraper/jobs/:id — cancel a running job
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const { id } = await params;
  const job = await ScrapeJob.findById(id);
  if (!job) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  if (job.status === "completed" || job.status === "failed") {
    return NextResponse.json(
      { success: false, error: "Job already finished" },
      { status: 400 }
    );
  }

  job.status = "failed";
  job.error = "Cancelled by admin";
  job.completedAt = new Date();
  await job.save();

  return NextResponse.json({ success: true });
}
