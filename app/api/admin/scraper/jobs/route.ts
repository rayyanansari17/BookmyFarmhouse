import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { connectDB } from "@/lib/db/mongoose";
import ScrapeJob from "@/lib/db/models/ScrapeJob.model";
import mongoose from "mongoose";

// GET /api/admin/scraper/jobs — list recent scrape jobs
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
  const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);
  const skip = (page - 1) * limit;

  const [jobs, total] = await Promise.all([
    ScrapeJob.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ScrapeJob.countDocuments({}),
  ]);

  return NextResponse.json({ success: true, data: jobs, total, page, limit });
}

// POST /api/admin/scraper/jobs — create a new scrape job and dispatch to Railway service
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { source, query, city, limit = 50 } = body as {
    source: string;
    query: string;
    city: string;
    limit?: number;
  };

  if (!source || !query || !city) {
    return NextResponse.json(
      { success: false, error: "source, query, and city are required" },
      { status: 400 }
    );
  }

  const scraperUrl = process.env.SCRAPER_SERVICE_URL;
  if (!scraperUrl) {
    return NextResponse.json(
      { success: false, error: "SCRAPER_SERVICE_URL not configured — Railway service not set up yet" },
      { status: 503 }
    );
  }

  await connectDB();

  const callbackUrl = process.env.NEXTAUTH_URL ?? "https://bookmyfarmhouse.app";

  const job = await ScrapeJob.create({
    source,
    query,
    city: city.toLowerCase(),
    limit: Math.min(limit, 200),
    callbackUrl,
    createdBy: new mongoose.Types.ObjectId(session.user.id),
    logs: [`Job created — dispatching to scraper service`],
  });

  // Dispatch to Railway scraper service (non-blocking — job runs async)
  try {
    const secret = process.env.SCRAPER_SECRET ?? "";
    const dispatchRes = await fetch(`${scraperUrl}/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-scraper-secret": secret,
      },
      body: JSON.stringify({
        jobId: job._id.toString(),
        source,
        query,
        city,
        limit: job.limit,
        callbackUrl,
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!dispatchRes.ok) {
      const err = await dispatchRes.text();
      await ScrapeJob.findByIdAndUpdate(job._id, {
        status: "failed",
        error: `Scraper service rejected job: ${err}`,
        completedAt: new Date(),
      });
      return NextResponse.json(
        { success: false, error: "Scraper service rejected the job" },
        { status: 502 }
      );
    }
  } catch (err) {
    await ScrapeJob.findByIdAndUpdate(job._id, {
      status: "failed",
      error: `Could not reach scraper service: ${err instanceof Error ? err.message : "network error"}`,
      completedAt: new Date(),
    });
    return NextResponse.json(
      { success: false, error: "Could not reach Railway scraper service" },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true, data: job }, { status: 201 });
}
